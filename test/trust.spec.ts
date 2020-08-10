import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import { network } from "@nomiclabs/buidler";
import chai from "chai";

// contract artifacts
import Trust from "../artifacts/Trust.json";
import Token from "../artifacts/Token.json";
import Moloch from "../artifacts/Moloch.json";

import { KnightsTrustFactories } from "./utils/types";
import utils from "./utils/utils";
import C from "./utils/constants";

// configure chai to use waffle matchers
chai.use(solidity);
const { expect } = chai;

describe("Knight's trust", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let owner: ethers.Signer;
  let _owner: String;

  // contracts
  let factories: KnightsTrustFactories;
  let trust: ethers.Contract;
  let capTok: ethers.Contract;
  let distTok: ethers.Contract;
  let moloch: ethers.Contract;

  before("get provider", async () => {
    provider = new ethers.providers.Web3Provider(
      utils.fixProvider(network.provider as any)
    );
    owner = provider.getSigner(0);
    _owner = await owner.getAddress();

    factories = {
      trust: utils.getFactory(Trust, owner),
      token: utils.getFactory(Token, owner),
      moloch: utils.getFactory(Moloch, owner)
    };
  });

  beforeEach("deploy contracts", async () => {
    capTok = await factories.token.deploy("CAP");
    distTok = await factories.token.deploy("DIST");

    moloch = await factories.moloch.deploy(
      _owner,
      [ capTok.address, distTok.address ],
      C.molochConfig.PERIOD_DURATION_IN_SECONDS,
      C.molochConfig.VOTING_DURATON_IN_PERIODS,
      C.molochConfig.GRACE_DURATON_IN_PERIODS,
      C.molochConfig.PROPOSAL_DEPOSIT,
      C.molochConfig.DILUTION_BOUND,
      C.molochConfig.PROCESSING_REWARD
    );

    trust = await factories.trust.deploy(
      moloch.address,
      capTok.address,
      distTok.address,
      C.oneYear,
      C.vestingDistribution.recipients,
      C.vestingDistribution.amts
    );

    // set token balances
    await capTok.mint(moloch.address, C.CapTokenAmt);
    await distTok.mint(trust.address, C.totalDistribution);

    // extra moloch bs
    await capTok.mint(_owner, 100);
    await capTok.approve(moloch.address, 100, {from: _owner});
    await utils.getMolochGuildBalNonzero(moloch, _owner, capTok.address);
    await moloch.collectTokens(capTok.address);
  });

  describe("constructor()", () => {

    it("deploys correctly", async () => {
      expect(await trust.MOLOCH_GUILD_ADDR()).to.eq(await moloch.GUILD());
      expect(await trust.moloch()).to.eq(moloch.address);
      expect(await trust.molochCapitalToken()).to.eq(capTok.address);
      expect(await trust.distributionToken()).to.eq(distTok.address);
      expect(await trust.unlocked()).to.be.false;

      const dist = C.vestingDistribution
      for (let i = 0; i < dist.recipients.length; i++) {
        expect(await trust.distributions(dist.recipients[i])).to.eq(dist.amts[i]);
      }

      const deployTime = (await provider.getBlock(trust.deployTransaction.blockNumber!)).timestamp;
      expect(await trust.unlockTime()).to.eq(deployTime + C.oneYear);
    });
  });

  describe("unlock()", () => {
    it("reverts if vesting not reached or capToken not spent", async () => {
      await utils.bumpTime(1, 100);
      await expect(trust.unlock()).to.be.revertedWith(C.revertStrings.trust.NOT_VESTED);
    });

    it("unlocks if vesting time past", async () => {
      await utils.bumpTime(1, C.oneYear);
      await trust.unlock();
      expect(await trust.unlocked()).to.be.true;
    });

    it("unlocks if funds spent", async () => {
      await utils.molochZeroGuildBalance(moloch, capTok.address);
      await trust.unlock();
      expect(await trust.unlocked()).to.be.true;
    });

    it("reverts if already unlocked", async () => {
      await utils.bumpTime(1, C.oneYear);
      await trust.unlock();
      await expect(trust.unlock()).to.be.revertedWith(C.revertStrings.trust.ALREADY_UNLOCKED);
    })
  });

  describe("claim()", () => {

    it("reverts if locked", async () => {
      await expect(
        trust.claim(C.vestingDistribution.recipients[0])
      ).to.be.revertedWith(C.revertStrings.trust.LOCKED);
    });

    it("reverts if recipient has 0 distribution", async () => {
      await utils.bumpTime(1, C.oneYear);
      await trust.unlock();
      await expect(
        trust.claim(C.AddressZero)
      ).to.be.revertedWith(C.revertStrings.trust.NO_DIST);
    });

    it("cannot be claimed twice", async () => {
      await utils.bumpTime(1, C.oneYear);
      await trust.unlock();
      await trust.claim(C.vestingDistribution.recipients[0]);
      await expect(
        trust.claim(C.vestingDistribution.recipients[0])
      ).to.be.revertedWith(C.revertStrings.trust.NO_DIST);
    });

    it("zeroes distribution and transfers tokens", async () => {
      await utils.bumpTime(1, C.oneYear);
      await trust.unlock();

      const recip = C.vestingDistribution.recipients[0];
      const amt = C.vestingDistribution.amts[0];
      const bal0 = await distTok.balanceOf(recip);

      await trust.claim(recip);
      expect(await trust.distributions(recip)).to.eq(0);
      expect(await distTok.balanceOf(recip)).to.eq(bal0 + amt);
    });

    it("works with repeats of the same recipient address", async () => {
      const repeater = "0x1F9975C3A8Bcb23922c53e1ea6478F853029b138";
      const repeatDist = {
        "recipients": [
          repeater,
          "0xa01D6a90801201cA50266d02e8F88927dd2dA6a6",
          repeater,
          "0x75b84Df56ba7ca7E47320Daf7df2f17a1aA8ada8"
        ],
        amts: [ 1, 2, 3, 4 ]
      }

      const repeatTrust = await factories.trust.deploy(
        moloch.address,
        capTok.address,
        distTok.address,
        C.oneYear,
        repeatDist.recipients,
        repeatDist.amts
      );

      expect(await repeatTrust.distributions(repeater)).to.eq(4);
    })

  });
});

