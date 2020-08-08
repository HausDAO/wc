import { ethers } from "ethers";

interface KnightsTrustFactories {
  trust: ethers.ContractFactory,
  token: ethers.ContractFactory,
  moloch: ethers.ContractFactory,
}

interface TransmutationFactories {
  tmut: ethers.ContractFactory,
  token: ethers.ContractFactory,
  moloch: ethers.ContractFactory,
}

export {
  KnightsTrustFactories,
  TransmutationFactories
}
