import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import { network } from "@nomiclabs/buidler";
import chai from "chai";

// contract artifacts
import Factory from "../artifacts/Factory.json";
import Token from "../artifacts/Token.json";
import Minion from "../artifacts/Minion.json";
import Trust from "../artifacts/Trust.json";
import Transmutation from "../artifacts/Transmutation.json";
import Moloch from "../artifacts/Moloch.json";

import { FactoryFactories } from "./utils/types";
import utils from "./utils/utils";
import C from "./utils/constants";

// configure chai to use waffle matchers
chai.use(solidity);
const { expect } = chai;

describe("All together now", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let deployer: ethers.Signer;
  let member: ethers.Signer;
  let anyone: ethers.Signer;
  let _deployer: String;
  let _member: String;

  let factories: FactoryFactories;
  let capTok: ethers.Contract;
  let hausTok: ethers.Contract;
  let factory: ethers.Contract;
  let tmut: ethers.Contract; // transmutation contract
  let trust: ethers.Contract;
  let moloch: ethers.Contract;
  let minion: ethers.Contract;

  before("get provider", async () => {
    provider = new ethers.providers.Web3Provider(
      utils.fixProvider(network.provider as any)
    );
    deployer = provider.getSigner(0);
    member = provider.getSigner(1);
    anyone = provider.getSigner(1);
    _deployer = await deployer.getAddress();
    _member = await member.getAddress();

    factories = {
      factory: utils.getFactory(Factory, deployer),
      token: utils.getFactory(Token, deployer),
      moloch: utils.getFactory(Moloch, member)
    };
  });

  beforeEach("deploy system", async () => {
    capTok = await factories.token.deploy("NAME-CAP", "CAP");
    hausTok = await factories.token.deploy("NAME-HAUS", "HAUS");
    moloch = await factories.moloch.deploy(
      _member,
      [ capTok.address ],
      C.molochConfig.PERIOD_DURATION_IN_SECONDS,
      C.molochConfig.VOTING_DURATON_IN_PERIODS,
      C.molochConfig.GRACE_DURATON_IN_PERIODS,
      C.molochConfig.PROPOSAL_DEPOSIT,
      C.molochConfig.DILUTION_BOUND,
      C.molochConfig.PROCESSING_REWARD,
    );
    await capTok.mint(moloch.address, C.MaxUint256.div(2));
    await capTok.mint(_member, C.MaxUint256.div(2));
    await capTok.connect(member).approve(moloch.address, C.MaxUint256.div(2));
    await utils.getMolochGuildBalNonzero(moloch, _member, capTok.address);
    await moloch.collectTokens(capTok.address);

    factory = await factories.factory.deploy();

    const dist = {
      transmutationDist: 100000,
      trustDist: 50000,
      minionDist: 850000
    };

    await hausTok.mint(_deployer, utils.totalDist(dist));
    await hausTok.approve(factory.address, utils.totalDist(dist));

    const deployReceipt = await factory.deployAll(
      moloch.address,
      capTok.address,
      hausTok.address,
      C.oneYear,
      dist.transmutationDist,
      dist.trustDist,
      dist.minionDist,
      C.vestingDistribution.recipients,
      C.vestingDistribution.amts
    );

    // get deployed contracts
    const filter = factory.filters.Deployment()
    const event = (await provider.getLogs(filter))[0];
    const deployed = factory.interface.parseLog(event).args;

    minion = new ethers.Contract(deployed.minion, Minion.abi, anyone);
    tmut = new ethers.Contract(deployed.transmutation, Transmutation.abi, anyone);
    trust = new ethers.Contract(deployed.trust, Trust.abi, anyone);

    await utils.molochWhitelistToken(moloch, hausTok.address);
  });

  it("distributes funds after passed transmutation", async () => {
    const applicant = C.AddressOne;
    const giveAmt = 5;
    const getAmt = 10;
    const details = "the times 03/jan/2009";
    const molochHausBal0 = await moloch.userTokenBalances(
      C.MolochGuildAddress,
      hausTok.address
    );
    const applicantCapBal0 = await moloch.userTokenBalances(
      applicant,
      capTok.address
    );

    await tmut.propose(applicant, giveAmt, getAmt, details);
    const propId = (await moloch.proposalCount()).sub(1);
    await utils.molochPassAndProcess(moloch, propId);

    expect(await moloch.userTokenBalances(applicant, capTok.address))
      .to.eq(applicantCapBal0.add(getAmt));
    expect(await moloch.userTokenBalances(C.MolochGuildAddress, hausTok.address))
      .to.eq(molochHausBal0.add(giveAmt));
  });

  it("returns Transmutation funds after failed proposal", async () => {
    const applicant = C.AddressOne;
    const giveAmt = 5;
    const getAmt = 10;
    const details = "the times 03/jan/2009";

    const tmutHausBal0 = await hausTok.balanceOf(tmut.address);

    await tmut.propose(applicant, giveAmt, getAmt, details);
    const propId = (await moloch.proposalCount()).sub(1);

    await utils.molochFailAndProcess(moloch, propId);

    expect(await moloch.userTokenBalances(tmut.address, hausTok.address))
      .to.eq(giveAmt);

    await tmut.withdrawGiveToken();

    expect(await hausTok.balanceOf(tmut.address)).to.eq(tmutHausBal0);
  });

  it("allows Minion to steal Transmutation HAUS", async () => {
    const stealAmt = await hausTok.balanceOf(tmut.address);
    const minionHausBal0 = await hausTok.balanceOf(minion.address);

    const transferFromData = hausTok.interface.encodeFunctionData(
      "transferFrom",
      [ tmut.address, minion.address, stealAmt ]
    );

    await minion.proposeAction(hausTok.address, 0, transferFromData, "");
    const propId = (await moloch.proposalCount()).sub(1);
    await utils.molochPassAndProcess(moloch, propId);
    await minion.executeAction(propId);

    expect(await hausTok.balanceOf(minion.address))
      .to.eq(minionHausBal0.add(stealAmt));
  });
});
