import type { ReactiveEffect } from "./effect";

export const globalDepsMap = new WeakMap<
  Record<string, unknown>,
  Map<string, Set<ReactiveEffect>>
>();

export const globalReactiveMap = new WeakMap<
  Record<string, unknown>,
  Record<string, unknown>
>();

export const globalReadOnlyMap = new WeakMap<
  Record<string, unknown>,
  Record<string, unknown>
>();

export const globalShallowReactiveMap = new WeakMap<
  Record<string, unknown>,
  Record<string, unknown>
>();

export const globalShallowReadOnlyMap = new WeakMap<
  Record<string, unknown>,
  Record<string, unknown>
>();

(window as any).__globalDeps__ = globalDepsMap;
