const oneYear = 31556926

const INFURA_API_KEY = "";
const ETHERSCAN_API_KEY = "";

const MOLOCH_ADDRESS = "DEPLOY_FRESH"; // for local test net deployments
// const MOLOCH_ADDRESS = "0x501f352e32ec0c981268dc5b5ba1d3661b1acbc6"; // kovan moloch
const CAP_TOKEN_ADDRESS = "0xd0a1e359811322d97991e03f863a0c30c2cf029c"; // kovan weth
const VESTING_PERIOD = oneYear;
const HAUS_TOKEN_SYMBOL = "SYM";
const TOKEN_DIST = {
  transmutationDist: 100000,
  trustDist: 50000,
  minionDist: 850000
}
const VESTING_DIST = {
  "recipients": [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
    "0x0000000000000000000000000000000000000005",
    "0x0000000000000000000000000000000000000006",
    "0x0000000000000000000000000000000000000007",
    "0x0000000000000000000000000000000000000008",
    "0x0000000000000000000000000000000000000009",
    "0x0000000000000000000000000000000000000010",
    "0x0000000000000000000000000000000000000011",
    "0x0000000000000000000000000000000000000012",
    "0x0000000000000000000000000000000000000013",
    "0x0000000000000000000000000000000000000014",
    "0x0000000000000000000000000000000000000015",
    "0x0000000000000000000000000000000000000016",
    "0x0000000000000000000000000000000000000017",
    "0x0000000000000000000000000000000000000018",
    "0x0000000000000000000000000000000000000019",
    "0x0000000000000000000000000000000000000020",
    "0x0000000000000000000000000000000000000021",
    "0x0000000000000000000000000000000000000022"
  ],

  "amts": [
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122
  ]
};

export default {
  MOLOCH_ADDRESS,
  CAP_TOKEN_ADDRESS,
  VESTING_PERIOD,
  HAUS_TOKEN_SYMBOL,
  TOKEN_DIST,
  VESTING_DIST,
  INFURA_API_KEY,
  ETHERSCAN_API_KEY
}
