import { ethers } from "ethers";

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

export {
  fixProvider,
  getFactory
}
