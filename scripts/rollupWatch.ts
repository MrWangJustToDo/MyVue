import { watch as rollup } from "rollup";

import { getRollupConfig } from "./rollupConfig";

import type { packages } from "./type";
import type { RollupOptions } from "rollup";

const watch = (packageName: string, rollupOptions: RollupOptions, isUMD: boolean) => {
  rollupOptions.watch = {
    buildDelay: 300,
    exclude: ["node_modules"],
    clearScreen: true,
  };

  const watcher = rollup(rollupOptions);

  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_START") {
      console.log(`[watch] start build package ${packageName} ${isUMD ? "in umd format" : ""}`);
    }
    if (event.code === "BUNDLE_END") {
      console.log(`[watch] package ${packageName} ${isUMD ? "in umd format" : ""} build success!`);
    }
    if (event.code === "ERROR") {
      console.log(
        `[watch] package ${packageName} ${isUMD ? "in umd format" : ""} build error, ${
          event.error.stack
        }`
      );
    }
  });
};

const rollupWatch = async (packageName: packages) => {
  const [otherBuild, umdBuild] = await getRollupConfig(packageName);

  if (otherBuild) {
    watch(packageName, otherBuild, false);
  }

  if (umdBuild) {
    watch(packageName, umdBuild, true);
  }
};

rollupWatch("shared");
rollupWatch("reactivity");
rollupWatch("runtime-core");
rollupWatch("runtime-dom");
