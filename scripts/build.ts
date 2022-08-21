import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFile } from "fs/promises";
import { memoize } from "lodash";
import { resolve } from "path";
import { rollup } from "rollup";

import { transformBuildOptions } from "./utils";

import type { packages } from "./utils";
import type { RollupOptions, OutputOptions } from "rollup";

const memoizeReadFile = memoize(readFile, (path) => path);

const rollupBuild = async (packages: packages) => {
  const relativePath = resolve(process.cwd(), "packages", packages);
  const pkgPath = resolve(relativePath, "package.json");
  const content = await memoizeReadFile(pkgPath, { encoding: "utf-8" });
  const pkg = JSON.parse(content);
  const buildOptions = pkg["buildOptions"];
  const transformedOptions = transformBuildOptions(
    buildOptions,
    relativePath
  ) as RollupOptions;
  try {
    const bundle = await rollup({
      input: transformedOptions.input as string,
      plugins: [
        nodeResolve(),
        commonjs({ exclude: "node_modules" }),
        typescript({ tsconfig: resolve(relativePath, "tsconfig.json") }),
      ],
      onwarn: (msg, warn) => {
        // 忽略 Circular 的错误
        if (!/Circular/.test(msg.message)) {
          warn(msg);
        }
      },
    });
    await Promise.all(
      (transformedOptions.output as OutputOptions[]).map((config) =>
        bundle.write(config)
      )
    );
  } catch (e) {
    console.error(e);
  }
  console.log("build done", packages);
};

const start = async () => {
  await rollupBuild("shared");
  await rollupBuild("reactivity");
  await rollupBuild("runtime-dom");
  await rollupBuild("runtime-core");
  process.exit(0);
};

start();
