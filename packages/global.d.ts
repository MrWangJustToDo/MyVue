/// <reference types="vite/client" />

// Global compile-time constants
declare let __DEV__: boolean;
declare let __TEST__: boolean;
declare let __BROWSER__: boolean;
declare let __GLOBAL__: boolean;
declare let __ESM_BUNDLER__: boolean;
declare let __ESM_BROWSER__: boolean;
declare let __NODE_JS__: boolean;
declare let __SSR__: boolean;
declare let __COMMIT__: string;
declare let __VERSION__: string;
declare let __COMPAT__: boolean;

// Feature flags
declare let __FEATURE_OPTIONS_API__: boolean;
declare let __FEATURE_PROD_DEVTOOLS__: boolean;
declare let __FEATURE_SUSPENSE__: boolean;

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
