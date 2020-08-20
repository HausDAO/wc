import path from "path";
import { task } from "@nomiclabs/buidler/config";

task("compile-flat", "Flattens and compiles WC contracts")
  .setAction(async (_, bre) => {
    await bre.run("flatten-in-a-less-shitty-way");
    bre.config.paths.sources = path.posix.resolve(__dirname, "../flattened")
    bre.config.paths.artifacts = path.posix.resolve(__dirname, "../artifacts-flattened")
    await bre.run("compile");
  });
