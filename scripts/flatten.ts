import fs from "fs";
import path from "path";

import { task } from "@nomiclabs/buidler/config";
import flattener from "truffle-flattener";

async function flatten(dir: string, file: string) {
  const flattenedContract = await flattener([
    path.posix.resolve(__dirname, dir + file)
  ]);

  fs.writeFileSync(
    path.posix.resolve(__dirname, "../flattened/" + file),
    flattenedContract
  );
}

task("flatten-in-a-less-shitty-way", "Flattens WC contracts to individual files")
  .setAction(async (_, bre) => {
    const toFlatten = [
      "Factory.sol",
      "Minion.sol",
      "Token.sol",
      "Transmutation.sol",
      "Trust.sol",
    ];

    const promises = toFlatten.map(f => flatten("../contracts/", f));
    promises.push(flatten("../contracts/moloch/", "Moloch.sol"));
    await Promise.all(promises);
  });
