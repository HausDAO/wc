import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

import "./scripts/deploy";

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
    // TODO
    rinkeby: {
      url: "http://localhost:8545",
    }
  }

};

export default config;
