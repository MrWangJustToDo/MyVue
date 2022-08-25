import { watch } from "rollup";

import { getRollupConfig } from "./rollupConfig";

import type { packages } from "./type";

const rollupWatch = async (packageName: packages) => {
  const rollupOptions = await getRollupConfig(packageName);

  // watch options
  rollupOptions.watch = {
    buildDelay: 300,
    exclude: ["node_modules"],
    clearScreen: true,
  };

  const watcher = watch(rollupOptions);

  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_START") {
      console.log(`[watch] start build package ${packageName}`);
    }
    if (event.code === "BUNDLE_END") {
      console.log(`[watch] package ${packageName} build success!`);
    }
    if (event.code === "ERROR") {
      console.log(
        `[watch] package ${packageName} build error, ${event.error.stack}`
      );
    }
  });
};

rollupWatch("shared");
rollupWatch("reactivity");
rollupWatch("runtime-dom");
rollupWatch("runtime-core");
