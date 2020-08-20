import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

import "./scripts/deploy";
import "./scripts/flatten";
import "./scripts/compile-flat.ts";
import params from "./deploy_params";

const config: BuidlerConfig = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.5.11",
    optimizer: {
      enabled: true,
      runs: 200
    },
  },
  networks: {
    develop: {
      url: "http://localhost:8545",
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${params.INFURA_API_KEY}`,
    }
  }
};

export default config;
