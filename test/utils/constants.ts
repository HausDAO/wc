import { ethers } from "ethers";

// --- Knight's trust parameters ---
const vestingDistribution = {
  "recipients": [
    "0x1F9975C3A8Bcb23922c53e1ea6478F853029b138", 
    "0xa01D6a90801201cA50266d02e8F88927dd2dA6a6",
    "0x96F4efaB4Ed5251A493E2C94C8bAffe898748015",
    "0x75b84Df56ba7ca7E47320Daf7df2f17a1aA8ada8"
  ],
  "amts": [ 1, 2, 3, 4 ]
};
const totalDistribution = vestingDistribution.amts.reduce((a, b) => a + b, 0);

const oneYear = 31536000

// --- Moloch parameters ---
const molochConfig = {
  PERIOD_DURATION_IN_SECONDS: 17280,
  VOTING_DURATON_IN_PERIODS: 35,
  GRACE_DURATON_IN_PERIODS: 35,
  PROPOSAL_DEPOSIT: 10,
  DILUTION_BOUND: 3,
  PROCESSING_REWARD: 1,
  TOKEN_SUPPLY: 10000
};
const MolochGuildAddress = "0x000000000000000000000000000000000000dEaD";

// --- revert strings ---
const revertStrings = {
  trust: {
    LOCKED: "Trust::tokens-locked",
    NO_DIST: "Trust::no-distribution",
    NOT_VESTED: "Trust::not-vested",
    ALREADY_UNLOCKED: "Trust::already-unlocked"
  },
  tmut: {
    APPLICANT: "Transmutation::invalid-applicant",
    NOT_MEMBER: "Transmutation::not-member",
    BALANCE: "Transmutation::insufficient-balance"
  },
  factory: {
    BAD_VESTING_DIST: "Factory::invalid-vesting-dist",
    BAD_TOKEN_DIST: "Factory::invalid-token-dist",
    FAILED_DIST: "Factory::failed-distribution"
  },
  token: {
    BALANCE: "ERC20: transfer amount exceeds balance",
    ALLOWANCE: "ERC20: transfer amount exceeds allowance"
  }
}

const CapTokenAmt = 100;

const TransmutationDetailsPrefix = '{"isTransmutation": true, "title":"TRANSMUTATION", "description":"';

const AddressOne = "0x0000000000000000000000000000000000000001";

const systemConstants = {
  molochConfig,
  vestingDistribution,
  totalDistribution,
  oneYear,
  revertStrings,
  CapTokenAmt,
  MolochGuildAddress,
  AddressOne,
  TransmutationDetailsPrefix
}

export default { ...ethers.constants, ...systemConstants }
