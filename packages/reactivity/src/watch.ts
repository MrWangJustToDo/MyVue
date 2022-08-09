import { isFunction, isObject } from "@my-vue/shared";

import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

type WatchSource = (() => unknown) | unknown;
type WatchCallback = (
  newValue: unknown,
  oldValue: unknown,
  onCleanUp: (fn: () => void) => void
) => void;

function traversal(target: unknown, set = new Set()) {
  if (isObject(target)) {
    if (set.has(target)) return target;
    set.add(target);
    for (const key in target) {
      traversal(target[key], set);
    }
    return target;
  } else {
    return target;
  }
}

export function watch(source: WatchSource, cb: WatchCallback) {
  let effectAction: () => unknown = () => void 0;
  if (isReactive(source)) {
    effectAction = () => traversal(source);
  } else if (isFunction(source)) {
    effectAction = source;
  } else {
    return;
  }

  let cleanUp: (() => void) | null = null;

  const onCleanUp = (fn: () => void) => {
    cleanUp = fn;
  };

  let oldValue: unknown = null;

  const effect = new ReactiveEffect(effectAction, () => {
    if (cleanUp) {
      cleanUp();
      cleanUp = null;
    }

    const newValue = effect.run();

    cb(newValue, oldValue, onCleanUp);

    oldValue = newValue;
  });

  oldValue = effect.run();
}
