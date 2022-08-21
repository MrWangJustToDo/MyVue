import { resolve } from "path";

export type packages = "reactivity" | "shared" | "runtime-dom" | "runtime-core";

export const transformBuildOptions = (
  options: Record<string, unknown>,
  relativePath: string
) => {
  options.input = resolve(relativePath, options.input as string);
  options.output = (options.output as Record<string, unknown>[]).map(
    (config: Record<string, unknown>) => {
      const res = { ...config };
      if (res["file"]) {
        res["file"] = resolve(relativePath, res["file"] as string);
      }
      if (res["dir"]) {
        res["dir"] = resolve(relativePath, res["dir"] as string);
      }
      return res;
    }
  );
  return options;
};
