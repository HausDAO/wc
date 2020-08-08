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

describe("Factory", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let deployer: ethers.Signer;
  let anyone: ethers.Signer;

  let factories: FactoryFactories;
  let capTok: ethers.Contract;
  let hausTok: ethers.Contract;
  let factory: ethers.Contract;
  let tmut: ethers.Contract; // transmutation contract
  let trust: ethers.Contract;
  let moloch: ethers.Contract;
  let minion: ethers.Contract;

  before("get provider", () => {
    provider = new ethers.providers.Web3Provider(
      utils.fixProvider(network.provider as any)
    );
    deployer = provider.getSigner(0);
    anyone = provider.getSigner(1);

    factories = {
      factory: utils.getFactory(Factory, deployer),
      token: utils.getFactory(Token, deployer),
      moloch: utils.getFactory(Moloch, deployer)
    };
  });

  beforeEach("deploy contracts", async () => {
    capTok = await factories.token.deploy("name", "CAP");
    moloch = await factories.moloch.deploy(
      C.AddressOne,
      [ capTok.address ],
      C.molochConfig.PERIOD_DURATION_IN_SECONDS,
      C.molochConfig.VOTING_DURATON_IN_PERIODS,
      C.molochConfig.GRACE_DURATON_IN_PERIODS,
      C.molochConfig.PROPOSAL_DEPOSIT,
      C.molochConfig.DILUTION_BOUND,
      C.molochConfig.PROCESSING_REWARD,
    );

    factory = await factories.factory.deploy();
  });

  // TODO: reverts of individual deployments
  describe("deployAll()", () => {

    const dist = {
      minionDist: 100,
      transmutationDist: 10,
      trustDist: 5
    };

    it("reverts if vesting distribution lengths don't match", async () => {
      await expect(
        factory.deployAll(
          moloch.address,
          capTok.address,
          C.oneYear,
          "HAUS",
          dist,
          C.vestingDistribution.recipients,
          C.vestingDistribution.amts.slice(1)
        )
      ).to.be.revertedWith(C.revertStrings.factory.BAD_DISTRIBUTION);

      await expect(
        factory.deployAll(
          moloch.address,
          capTok.address,
          C.oneYear,
          "HAUS",
          dist,
          C.vestingDistribution.recipients.slice(1),
          C.vestingDistribution.amts
        )
      ).to.be.revertedWith(C.revertStrings.factory.BAD_DISTRIBUTION);

    });

    it("works", async () => {
      await factory.deployAll(
        moloch.address,
        capTok.address,
        C.oneYear,
        "HAUS",
        dist,
        C.vestingDistribution.recipients,
        C.vestingDistribution.amts
      );
      await factory.deployAll(
        moloch.address,
        capTok.address,
        C.oneYear,
        "HAUS",
        dist,
        C.vestingDistribution.recipients,
        C.vestingDistribution.amts
      );

      // check initialization vals of all contracts
      const filter = factory.filters.Deployment()
      const event = (await provider.getLogs(filter))[0];
      const deployed = factory.interface.parseLog(event).args;

      // check deployed bytecode
      expect(await provider.getCode(deployed.distributionToken))
        .to.eq(Token.deployedBytecode);
      expect(await provider.getCode(deployed.minion))
        .to.eq(Minion.deployedBytecode);
      expect(await provider.getCode(deployed.transmutation))
        .to.eq(Transmutation.deployedBytecode);
      expect(await provider.getCode(deployed.trust))
        .to.eq(Trust.deployedBytecode);

      // get deployed contracts
      const hausTok = new ethers.Contract(deployed.distributionToken, Token.abi, anyone);
      const minion = new ethers.Contract(deployed.minion, Minion.abi, anyone);
      const tmut = new ethers.Contract(deployed.transmutation, Transmutation.abi, anyone);
      const trust = new ethers.Contract(deployed.trust, Trust.abi, anyone);

      // check minion
      expect(await minion.moloch()).to.eq(moloch.address);

      // check token
      expect(await hausTok.totalSupply()).to.eq(utils.totalDist(dist));
    });
  })
});
