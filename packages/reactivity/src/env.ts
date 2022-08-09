import type { ReactiveEffect } from "./effect";

export const globalDepsMap = new WeakMap<
  Record<string, unknown>,
  Map<string, Set<ReactiveEffect>>
>();

export const globalReactiveMap = new WeakMap<
  Record<string, unknown>,
  Record<string, unknown>
>();

(window as any).__globalDeps__ = globalDepsMap;
(window as any).__globalReactive__ = globalReactiveMap;
