import { ethers } from "ethers";

// --- Knight's trust parameters ---
const distribution = [
  {recipient: "0x1F9975C3A8Bcb23922c53e1ea6478F853029b138", amt: 1},
  {recipient: "0xa01D6a90801201cA50266d02e8F88927dd2dA6a6", amt: 2},
];
const totalDistribution = distribution.reduce((sum, dist) => sum + dist.amt, 0);

// 1 year
const vestingPeriod = 31556926

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
  token: {
    BALANCE: "token-insufficient-balance"
  }
}

const CapTokenAmt = 100;

const TransmutationDetailsPrefix = '{"isTransmutation": true, "title":"TRANSMUTATION", "description":"';

const AddressOne = "0x0000000000000000000000000000000000000001";

const systemConstants = {
  molochConfig,
  distribution,
  totalDistribution,
  vestingPeriod,
  revertStrings,
  CapTokenAmt,
  MolochGuildAddress,
  AddressOne,
  TransmutationDetailsPrefix
}

export default { ...ethers.constants, ...systemConstants }
