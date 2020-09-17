import { ethers, BigNumber } from "ethers";

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

function getFactory(artifact: any, signer?: ethers.Signer) {
  return new ethers.ContractFactory(
    new ethers.utils.Interface(artifact.abi),
    artifact.bytecode,
    signer
  );
}

function totalDist(dist: Record<string, ethers.BigNumberish>) {
  return Object.keys(dist).reduce((a:ethers.BigNumber, b:string) =>
    a.add(ethers.BigNumber.from(dist[b])), ethers.BigNumber.from("0")
  );
}

function strToEth(val: ethers.BigNumberish) {
  return ethers.utils.formatEther(ethers.BigNumber.from(val));
}

export {
  fixProvider,
  getFactory,
  totalDist,
  strToEth
}
