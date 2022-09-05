import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import fs from "fs";
import { readFile, access } from "fs/promises";
import { resolve } from "path";

import type { RollupOptions } from "rollup";

const checkFileExist = (path: string) =>
  access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

const transformBuildOptions = (options: RollupOptions, relativePath: string) => {
  const optionArray: RollupOptions[] = [];
  if (typeof options.input === "string" && !options.input.startsWith(relativePath)) {
    options.input = resolve(relativePath, options.input);
  }
  if (options.output) {
    options.output = Array.isArray(options.output) ? options.output : [options.output];
    const umdConfig = options.output.find((output) => output.format === "umd");
    const otherConfig = options.output.filter((output) => output.format !== "umd");
    options.output = options.output.map((output) => {
      if (output.dir && !output.dir.startsWith(relativePath)) {
        output.dir = resolve(relativePath, output.dir);
      }
      if (output.file && !output.file.startsWith(relativePath)) {
        output.file = resolve(relativePath, output.file);
      }
      return output;
    });
    optionArray.push({
      input: options.input,
      output: otherConfig,
    });
    if (umdConfig) {
      optionArray.push({
        input: options.input,
        output: [umdConfig],
      });
    }
  }
  return optionArray;
};

const defaultBuildOptions: RollupOptions = {
  input: "./src/index.ts",
  output: [
    {
      dir: "./dist",
      entryFileNames: "cjs/index.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      dir: "./dist",
      entryFileNames: "esm/index.js",
      format: "esm",
      sourcemap: true,
    },
  ],
};

export const getRollupConfig = async (packageName: string) => {
  const relativePath = resolve(process.cwd(), "packages", packageName);

  const packageFilePath = resolve(relativePath, "package.json");

  const isPackageFileExist = await checkFileExist(packageFilePath);

  if (!isPackageFileExist) {
    throw new Error(`current package ${packageName} not exist!`);
  }

  const packageFileContent = await readFile(packageFilePath, {
    encoding: "utf-8",
  });

  const packageFileObject = JSON.parse(packageFileContent);

  let rollupConfig: RollupOptions = { ...defaultBuildOptions };

  if (packageFileObject["buildOptions"]) {
    rollupConfig = packageFileObject["buildOptions"] as RollupOptions;
  }

  if (!rollupConfig.input) {
    throw new Error(`current package ${packageName} not have a input config`);
  }

  if (!rollupConfig.output) {
    throw new Error(`current package ${packageName} not have a output config`);
  }

  const allRollupOptions = transformBuildOptions(rollupConfig, relativePath);

  if (allRollupOptions[0]) {
    allRollupOptions[0].external = (id) => id.includes("node_modules") || id.includes("@my-vue/");
  }

  allRollupOptions.forEach((options) => {
    if (options) {
      options.plugins = [
        nodeResolve(),
        commonjs({ exclude: "node_modules" }),
        typescript({
          composite: true,
          declaration: true,
          declarationMap: true,
          emitDeclarationOnly: true,
          outputToFilesystem: false,
          cacheDir: resolve(relativePath, ".cache"),
          tsconfig: resolve(relativePath, "tsconfig.json"),
          declarationDir: resolve(relativePath, "dist/types"),
        }),
      ];
      options.onwarn = (msg, warn) => {
        if (!/Circular/.test(msg.message)) {
          warn(msg);
        }
      };
    }
  });

  return allRollupOptions;
};
