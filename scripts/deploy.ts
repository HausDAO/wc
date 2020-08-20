import { task } from "@nomiclabs/buidler/config";
import { ethers } from "ethers";

import Confirm from "prompt-confirm";
import { DeployParams } from "./utils/types";

import { fixProvider, getFactory, totalDist } from "./utils/utils";

import params from "../deploy_params";

task("deploy", "Deploys factory and uses factory.deployAll to deploy system")
  .addParam("mnemonic", "mnemonic to use for deployment")
  .setAction(async (args, bre) => {
    /* await bre.run("compile-flat"); */
    await bre.run("compile");

    /* const factoryPath = "../artifacts-flattened/Factory.json"; */
    const factoryPath = "../artifacts/Factory.json";
    const molochPath = "../artifacts/Moloch.json";
    const Factory: any = await import(factoryPath);
    const Moloch: any = await import(molochPath);

    const vestingDist = params.VESTING_DIST;
    check(
      vestingDist.recipients.length === vestingDist.amts.length,
      "**invalid vesting distribution**"
    );

    // MOLOCH_ADDRESS is set to DEPLOY_FRESH <=> on a test network
    check(
      ["develop", "buidlerevm"].includes(bre.network.name) ===
      (params.MOLOCH_ADDRESS === "DEPLOY_FRESH"),
      "Please set MOLOCH_ADDRESS to DEPLOY_FRESH if and only if running on a local test network"
    );

    // total vesting distributions <= token distribution to trust
    const totalVestingDists = params.VESTING_DIST.amts.reduce((a, b) => a + b);
    check(
      params.TOKEN_DIST.trustDist >= totalVestingDists,
      "Trust contract will not have enough tokens to pay out recipients"
    );

    // --- Get provider and deployer wallet ---
    const provider = new ethers.providers.Web3Provider(
      fixProvider(bre.network.provider)
    );
    const unconnectedWallet = ethers.Wallet.fromMnemonic(args.mnemonic, "m/44'/60'/0'/0/0");
    const wallet = await unconnectedWallet.connect(provider);

    // --- Deploy factory ---

    console.log("-----------------");
    console.log(
      `Deploying Factory to ${bre.network.name} from ${wallet.address}\n`,
       `Wallet balance:`,
       ethers.utils.formatEther(await provider.getBalance(wallet.address)),
       `ether\n`
    );

    // confirm deployment
    const confirmationPrompt = new Confirm("Continue?")
    const confirmFactoryDeploy = await confirmationPrompt.run();
    if (!confirmFactoryDeploy) {
      console.log("Factory deployment aborted");
      return
    }


    const factoryFactory = getFactory(Factory, wallet);
    const factory = await factoryFactory.deploy();

    const factDeployTx = await provider.getTransactionReceipt(
      factory.deployTransaction.hash
    );
    console.log('\nfactory deployment gas used:', factDeployTx.gasUsed.toString());
    console.log('factory address:', factory.address);
    console.log("-----------------");


    // --- Deploy WC System ---

    // deploy a fake moloch if on a local test network
    if(bre.network.name === "develop" || bre.network.name === "buidlerevm") {
      console.log("Local test network detected, deploying decoy moloch\n")

      // confirm deployment
      const confirmWCDeploy = await confirmationPrompt.run();
      if (!confirmWCDeploy) {
        console.log("Decoy moloch deployment aborted");
        return
      }

      const molochFactory = getFactory(Moloch, wallet);
      const moloch = await molochFactory.deploy(
        wallet.address,
        [ params.CAP_TOKEN_ADDRESS ],
        17280,
        35,
        35,
        10,
        3,
        1
      );

      console.log('decoy moloch deployed to', moloch.address);
      params.MOLOCH_ADDRESS = moloch.address;
    }

    console.log("-----------------");
    console.log(
      `Deploying WC system to ${bre.network.name} from ${wallet.address}\n`,
      "Wallet balance:",
      ethers.utils.formatEther(await provider.getBalance(wallet.address)),
      "ether",
      "\n\nParameters:\n",
      `Moloch address: ${params.MOLOCH_ADDRESS}\n`,
      `Capital token address: ${params.CAP_TOKEN_ADDRESS}\n`,
      `Distribution token symbol: ${params.HAUS_TOKEN_SYMBOL}\n`,
      `Initial token distributions:\n`,
      `   Minion: ${params.TOKEN_DIST.minionDist}\n`,
      `   Transmutation: ${params.TOKEN_DIST.transmutationDist}\n`,
      `   Knight's Trust: ${params.TOKEN_DIST.trustDist}\n`,
      `Contributor vesting period: ${(params.VESTING_PERIOD / 2629800).toFixed(2)} months\n`,
      "Contributor vesting distribution:"
    );
    for (let i = 0; i < vestingDist.amts.length; i++) {
      // TODO: units
      console.log(
      `   ${vestingDist.recipients[i]} gets ${vestingDist.amts[i]}`
      );
    }
    console.log("");

    // confirm deployment
    const confirmWCDeploy = await confirmationPrompt.run();
    if (!confirmWCDeploy) {
      console.log("WC system deployment aborted");
      return
    }

    const deployReceipt = await factory.deployAll(
      params.MOLOCH_ADDRESS,
      params.CAP_TOKEN_ADDRESS,
      params.VESTING_PERIOD,
      params.HAUS_TOKEN_SYMBOL,
      params.TOKEN_DIST,
      params.VESTING_DIST.recipients,
      params.VESTING_DIST.amts,
    )

    const sysDeployTx = await provider.getTransactionReceipt(deployReceipt.hash);
    console.log('\nsystem deployment gas used:', sysDeployTx.gasUsed.toString());

    // get deployed addresses
    const filter = factory.filters.Deployment()
    const event = (await provider.getLogs(filter))[0];
    const deployed = factory.interface.parseLog(event).args;
    console.log("\ndeployed addresses");
    console.log(`Minion: ${deployed.minion}`);
    console.log(`Trust: ${deployed.trust}`);
    console.log(`Transmutation: ${deployed.transmutation}`);

    console.log("-----------------");
  });

function check(pred: Boolean, err: String) {
  if (!pred) throw err;
}

