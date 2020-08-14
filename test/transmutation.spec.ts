import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import { network } from "@nomiclabs/buidler";
import chai from "chai";

import Transmutation from "../artifacts/Transmutation.json";
import Token from "../artifacts/Token.json";
import Moloch from "../artifacts/Moloch.json";

import { TransmutationFactories } from "./utils/types";
import utils from "./utils/utils";
import C from "./utils/constants";

// configure chai to use waffle matchers
chai.use(solidity);
const { expect } = chai;

describe("Transmutation", () => {
  const owner = "0x000000000000000000000000000000000000abab";
  const applicant = "0x000000000000000000000000000000000000cdcd";
  let provider: ethers.providers.JsonRpcProvider;
  let member: ethers.Signer;
  let deployer: ethers.Signer;
  let _member: String;

  // contracts
  let factories: TransmutationFactories;
  let tmut: ethers.Contract;
  let capTok: ethers.Contract;
  let hausTok: ethers.Contract;
  let moloch: ethers.Contract;

  before("getProvider", async () => {
    provider = new ethers.providers.Web3Provider(
      utils.fixProvider(network.provider as any)
    );
    deployer = provider.getSigner(0);
    member = provider.getSigner(1);
    _member = await member.getAddress();

    factories = {
      tmut: utils.getFactory(Transmutation, deployer),
      token: utils.getFactory(Token, deployer),
      moloch: utils.getFactory(Moloch, deployer)
    };
  });

  beforeEach("deployContracts", async () => {
    capTok = await factories.token.deploy("CAP");
    hausTok = await factories.token.deploy("HAUS");

    moloch = await factories.moloch.deploy(
      _member,
      [ capTok.address, hausTok.address ],
      C.molochConfig.PERIOD_DURATION_IN_SECONDS,
      C.molochConfig.VOTING_DURATON_IN_PERIODS,
      C.molochConfig.GRACE_DURATON_IN_PERIODS,
      C.molochConfig.PROPOSAL_DEPOSIT,
      C.molochConfig.DILUTION_BOUND,
      C.molochConfig.PROCESSING_REWARD,
    );

    tmut = await factories.tmut.deploy(
      moloch.address,
      hausTok.address,
      capTok.address,
      owner
    );

    // set token balances
    await capTok.mint(moloch.address, C.CapTokenAmt);
    await hausTok.mint(tmut.address, 100);
  });

  describe("constructor()", () => {
    it("deploys correctly", async () => {

      expect(await tmut.moloch()).to.eq(moloch.address);
      expect(await tmut.giveToken()).to.eq(hausTok.address);
      expect(await tmut.getToken()).to.eq(capTok.address);

      // check Deploy event emitted
      const filter = tmut.filters.Deploy();
      const deployEvent = (await tmut.queryFilter(
        filter,
        tmut.deployTransaction.blockHash
      ))[0];
      expect(deployEvent.args!.moloch).to.eq(moloch.address);
      expect(deployEvent.args!.giveToken).to.eq(hausTok.address);
      expect(deployEvent.args!.getToken).to.eq(capTok.address);
      expect(deployEvent.args!.getToken).to.eq(capTok.address);
      expect(deployEvent.args!.owner).to.eq(owner);

      // check approvals
      expect(await hausTok.allowance(tmut.address, moloch.address)).to.eq(C.MaxUint256);
      expect(await hausTok.allowance(tmut.address, owner)).to.eq(C.MaxUint256);
    });
  });

  describe("propose()", () => {
    it("reverts if caller isn't moloch member", async () => {
      await expect(tmut.propose(applicant, 10, 10, ""))
        .to.be.revertedWith(C.revertStrings.tmut.NOT_MEMBER);
    });
    it("reverts if applicant == tmut.address", async () => {
      await expect(tmut.connect(member).propose(tmut.address, 10, 10, ""))
        .to.be.revertedWith(C.revertStrings.tmut.APPLICANT);
    });
    it("reverts if insufficient balance", async () => {
      await expect(
        tmut.connect(member).propose(applicant, 1000000000000, 10, "")
      ).to.be.revertedWith(C.revertStrings.token.BALANCE);
    });

    it("works", async () => {
      const giveAmt = 5;
      const getAmt = 10;
      const details = "the times 03/jan/2009";
      const bal0 = await hausTok.balanceOf(tmut.address);

      await tmut.connect(member).propose(applicant, giveAmt, getAmt, details);

      const propId = (await moloch.proposalCount()).sub(1);
      const prop = await moloch.proposals(propId);
      expect(prop.applicant.toLowerCase()).to.eq(applicant);
      expect(prop.proposer).to.eq(tmut.address);
      expect(prop.sharesRequested).to.eq(0);
      expect(prop.lootRequested).to.eq(0);
      expect(prop.tributeOffered).to.eq(giveAmt);
      expect(prop.tributeToken).to.eq(hausTok.address);
      expect(prop.paymentRequested).to.eq(getAmt);
      expect(prop.paymentToken).to.eq(capTok.address);
      expect(prop.details).to.eq(utils.toTransmutationDetails(details));

      // check balance updates
      expect(await hausTok.balanceOf(tmut.address)).to.eq(bal0 - giveAmt);
    });
  });

  describe("cancel", () => {
    it("reverts if caller isn't moloch member", async () => {
      await expect(tmut.cancel(0)).to.be.revertedWith(C.revertStrings.tmut.NOT_MEMBER);
    });

    it("cancels proposals", async () => {
      const giveAmt = 5;
      const getAmt = 10;
      const details = "the times 03/jan/2009";
      const bal0 = await hausTok.balanceOf(tmut.address);
      const molochBal0 = await moloch.userTokenBalances(
        tmut.address,
        hausTok.address
      );
      await tmut.connect(member).propose(applicant, giveAmt, getAmt, details);

      const propId = (await moloch.proposalCount()).sub(1);
      await tmut.connect(member).cancel(propId);

      // - check that proposal canceled
      const flags = await moloch.getProposalFlags(propId);
      expect(flags[3]).to.be.true;

      // check balances updated
      expect(await moloch.userTokenBalances(tmut.address, hausTok.address))
        .to.eq(molochBal0.add(giveAmt));

      // check balance can be withdrawn
      await tmut.withdrawGiveToken();
      expect(await hausTok.balanceOf(tmut.address))
        .to.eq(bal0.add(molochBal0));
    });
  });

});
