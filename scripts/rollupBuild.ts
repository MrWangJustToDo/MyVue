import { rollup } from "rollup";

import { getRollupConfig } from "./rollupConfig";

import type { packages } from "./type";
import type { OutputOptions } from "rollup";

const rollupBuild = async (packageName: packages) => {
  const rollupOptions = await getRollupConfig(packageName);
  console.log(`[build] start build package ${packageName}`);
  try {
    const { output, ...options } = rollupOptions;
    const bundle = await rollup(options);
    await Promise.all(
      (output as OutputOptions[]).map((output) => bundle.write(output))
    );
  } catch (e) {
    console.error(
      `[build] build package ${packageName} error, ${(e as Error).message}`
    );
    throw e;
  }
  console.log(`[build] build package ${packageName} success`);
};

const start = async () => {
  await rollupBuild("shared");
  await rollupBuild("reactivity");
  await rollupBuild("runtime-dom");
  await rollupBuild("runtime-core");
  process.exit(0);
};

start();
