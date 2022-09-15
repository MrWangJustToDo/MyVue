import type { OutputOptions } from "rollup";

export type packages = "reactivity" | "shared" | "runtime-dom" | "runtime-core";
export type Mode = "production" | "development";
export type MultipleOutput = OutputOptions & {
  multiple?: boolean;
};
