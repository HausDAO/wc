import { BuidlerConfig } from "@nomiclabs/buidler/config";

const config: BuidlerConfig = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.5.11",
    optimizer: {
      enabled: true,
      runs: 200
    },
  },
};

export default config;
