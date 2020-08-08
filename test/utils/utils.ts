import { ethers } from "ethers";
import { ethereum } from "@nomiclabs/buidler";
import C from "./constants";

// from wighawag/buidler-ethers-v5
function fixProvider(provider: any): any {
  // alow it to be used by ethers without any change
  if (provider.sendAsync === undefined) {
    provider.sendAsync = (
      req: {
        id: number;
        jsonrpc: string;
        method: string;
        params: any[];
      },
      callback: (error: any, result: any) => void
    ) => {
      provider
        .send(req.method, req.params)
        .then((result: any) =>
          callback(null, { result, id: req.id, jsonrpc: req.jsonrpc })
        )
        .catch((error: any) => callback(error, null));
    };
  }
  return provider;
}

async function bumpTime(periods: number, duration: number) {
  const timeIncrease = periods * duration;
  await ethereum.send("evm_increaseTime", [timeIncrease]);
  await ethereum.send("evm_mine", []);
}

function getFactory(artifact: any, signer?: ethers.Signer) {
  return new ethers.ContractFactory(
    new ethers.utils.Interface(artifact.abi),
    artifact.bytecode,
    signer
  );
}

async function molochPassAndProcess(
  moloch: ethers.Contract,
  propId: number
) {
  const propIdx = await moloch.getProposalQueueLength();
  await moloch.sponsorProposal(propId);
  await bumpTime(1, C.molochConfig.PERIOD_DURATION_IN_SECONDS);
  await moloch.submitVote(propIdx, 1);
  await bumpTime(
    C.molochConfig.VOTING_DURATON_IN_PERIODS,
    C.molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await bumpTime(
    C.molochConfig.GRACE_DURATON_IN_PERIODS,
    C.molochConfig.PERIOD_DURATION_IN_SECONDS
  );
  await moloch.processProposal(propIdx);
}

async function getMolochGuildBalNonzero(moloch: ethers.Contract, holder: String, token: String) {
  await moloch.submitProposal(
    holder,
    0,
    0,
    1,
    token,
    0,
    token,
    ""
  );
  const propId = await moloch.proposalCount() - 1;
  await molochPassAndProcess(moloch, propId);
}

async function molochZeroGuildBalance(moloch: ethers.Contract, token: String) {
  await moloch.submitProposal(
    C.AddressOne,
    0,
    0,
    0,
    token,
    await moloch.userTokenBalances(C.MolochGuildAddress, token),
    token,
    ""
  );
  const propId = await moloch.proposalCount() - 1;
  await molochPassAndProcess(moloch, propId);
}

/* function totalDist(dist: TokenDistribution) { */
function totalDist(dist: Record<string, number>) {
  return Object.keys(dist).reduce((a:number, b:string) => a + dist[b], 0);
}

function toTransmutationDetails(det: String) {
  return C.TransmutationDetailsPrefix + det + '"}'
}

export default {
  fixProvider,
  getFactory,
  getMolochGuildBalNonzero,
  molochZeroGuildBalance,
  bumpTime,
  totalDist,
  toTransmutationDetails,
}
