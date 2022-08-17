import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { watch } from "rollup";

import { transformBuildOptions } from "./utils";

import type { packages } from "./utils";
import type { RollupOptions } from "rollup";

const rollupWatch = async (packages: packages) => {
  const relativePath = resolve(process.cwd(), "packages", packages);
  const pkgPath = resolve(relativePath, "package.json");
  const content = await readFile(pkgPath, { encoding: "utf-8" });
  const pkg = JSON.parse(content);
  const buildOptions = pkg["buildOptions"];
  const transformedOptions = transformBuildOptions(
    buildOptions,
    relativePath
  ) as RollupOptions;
  const watcher = watch({
    ...transformedOptions,
    plugins: [
      nodeResolve(),
      commonjs({ exclude: "node_modules" }),
      typescript({ tsconfig: resolve(relativePath, "tsconfig.json") }),
    ],
    watch: {
      buildDelay: 300,
      exclude: ["node_modules"],
    },
    onwarn: (msg, warn) => {
      // 忽略 Circular 的错误
      if (!/Circular/.test(msg.message)) {
        warn(msg);
      }
    },
  });
  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_START") {
      console.log(`start build ${packages}...`);
    }
    if (event.code === "BUNDLE_END") {
      console.log(`package ${packages} build done!`);
    }
  });
};

rollupWatch("shared");
rollupWatch("reactivity");
rollupWatch("runtime-dom");
