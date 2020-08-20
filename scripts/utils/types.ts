interface TokenDist {
  transmutationDist: number,
  trustDist: number,
  minionDist: number
}

interface VestingDist {
  recipients: string[],
  amts: number[]

}

interface DeployParams {
  MOLOCH_ADDRESS: string,
  CAP_TOKEN_ADDRESS: string,
  VESTING_PERIOD: number,
  HAUS_TOKEN_SYMBOL: string,
  TOKEN_DIST: TokenDist,
  VESTING_DIST: VestingDist,
  INFURA_API_KEY?: string,
  ETHERSCAN_API_KEY?: string
}

export {
  DeployParams
}
