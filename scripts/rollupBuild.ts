import { rollup } from "rollup";

import { getRollupConfig } from "./rollupConfig";

import type { packages } from "./type";
import type { OutputOptions, RollupOptions } from "rollup";

const build = async (packageName: packages, rollupOptions: RollupOptions, isUMD: boolean) => {
  console.log(`[build] start build package ${packageName} ${isUMD ? "in umd format" : ""}`);
  try {
    const { output, ...options } = rollupOptions;
    const bundle = await rollup(options);
    await Promise.all((output as OutputOptions[]).map((output) => bundle.write(output)));
  } catch (e) {
    console.error(
      `[build] build package ${packageName} ${isUMD ? "in umd format error" : "error"}, ${
        (e as Error).message
      }`
    );
    throw e;
  }
  console.log(
    `[build] build package ${packageName} ${isUMD ? "in umd format success" : "success"}`
  );
};

const rollupBuild = async (packageName: packages) => {
  const [otherBuild, umdBuild] = await getRollupConfig(packageName);

  const all = [];

  if (otherBuild) {
    all.push(() => build(packageName, otherBuild, false));
  }

  if (umdBuild) {
    all.push(() => build(packageName, umdBuild, true));
  }

  await Promise.all(all.map((f) => f()));
};

const start = async () => {
  await rollupBuild("shared");
  await rollupBuild("reactivity");
  await rollupBuild("runtime-core");
  await rollupBuild("runtime-dom");
  process.exit(0);
};

start();
