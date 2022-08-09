import { isObject } from "@my-vue/shared";

import { createReactiveWithCache } from "./create";
import { createGetHandler, createSetHandler } from "./handler";
import { REACTIVE_KEY } from "./symbol";

export function reactive<T>(target: T) {
  if (isObject(target)) {
    if (isReactive(target)) return target;
    const proxyHandler: ProxyHandler<typeof target> = {
      get: createGetHandler(),
      set: createSetHandler(),
    };
    return createReactiveWithCache(target, proxyHandler) as T;
  } else {
    throw new Error("reactive() only accept a object value");
  }
}

export function isReactive(target: unknown): target is Record<string, unknown> {
  return isObject(target) && typeof target[REACTIVE_KEY] !== "undefined";
}
