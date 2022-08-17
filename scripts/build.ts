import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { rollup } from "rollup";

import { transformBuildOptions } from "./utils";

import type { packages } from "./utils";
import type { RollupOptions, OutputOptions } from "rollup";

const rollupBuild = async (packages: packages) => {
  const relativePath = resolve(process.cwd(), "packages", packages);
  const pkgPath = resolve(relativePath, "package.json");
  const content = await readFile(pkgPath, { encoding: "utf-8" });
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
      watch: { buildDelay: 300 },
    });
    await Promise.all(
      (transformedOptions.output as OutputOptions[]).map((config) =>
        bundle.write(config)
      )
    );
  } catch (e) {
    console.error(e);
  }
};

rollupBuild("shared");
rollupBuild("reactivity");
rollupBuild("runtime-dom");
