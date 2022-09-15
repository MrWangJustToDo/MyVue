/// <reference types="vite/client" />

declare const __DEV__: boolean;

// for tests
declare namespace jest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R, T> {
    toHaveBeenWarned(): R;
    toHaveBeenWarnedLast(): R;
    toHaveBeenWarnedTimes(n: number): R;
  }
}

declare module "*.vue" {}

declare module "file-saver" {
  export function saveAs(blob: any, name: any): void;
}

declare module "@vue/repl" {
  import type { ComponentOptions } from "@vue/runtime-core";

  const Repl: ComponentOptions;
  const ReplStore: any;
  export { Repl, ReplStore };
}

declare interface String {
  /**
   * @deprecated Please use String.prototype.slice instead of String.prototype.substring in the repository.
   */
  substring(start: number, end?: number): string;
}
