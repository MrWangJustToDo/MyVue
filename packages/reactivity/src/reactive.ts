import { isObject } from "@my-vue/shared";

import { createReactiveWithCache } from "./create";
import { REACTIVE_KEY, READONLY_KEY, ROW_KEY, SHALLOW_KEY } from "./symbol";

export function reactive<T>(target: T) {
  if (isObject(target)) {
    if (isReactive(target)) return target;
    return createReactiveWithCache(target, false, false) as T;
  } else {
    throw new Error("reactive() only accept a object value");
  }
}

export function readonly<T>(target: T) {
  if (isObject(target)) {
    if (isReadonly(target)) return target;
    return createReactiveWithCache(target, false, true) as T;
  } else {
    throw new Error("readonly() only accept a object value");
  }
}

export function shallowReactive<T>(target: T) {
  if (isObject(target)) {
    if (isReactive(target) && isShallow(target)) return target;
    return createReactiveWithCache(target, true, false) as T;
  } else {
    throw new Error("shallowReactive() only accept a object value");
  }
}

export function shallowReadonly<T>(target: T) {
  if (isObject(target)) {
    if (isReadonly(target) && isShallow(target)) return target;
    return createReactiveWithCache(target, true, true) as T;
  } else {
    throw new Error("shallowReadonly() only accept a object value");
  }
}

export function isReactive(target: unknown): target is Record<string, unknown> {
  return (
    isObject(target) &&
    typeof target[REACTIVE_KEY] === "boolean" &&
    !!target[REACTIVE_KEY]
  );
}

export function isReadonly(
  target: unknown
): target is Readonly<Record<string, unknown>> {
  return (
    isObject(target) &&
    typeof target[READONLY_KEY] === "boolean" &&
    !!target[READONLY_KEY]
  );
}

export function isShallow(target: unknown): target is Record<string, unknown> {
  return (
    isObject(target) &&
    typeof target[SHALLOW_KEY] === "boolean" &&
    !!target[SHALLOW_KEY]
  );
}

export function isProxy(target: unknown): target is Record<string, unknown> {
  return isReactive(target) || isReadonly(target);
}

export function toRaw<T>(observed: T): T {
  const raw = isObject(observed) && observed[ROW_KEY];
  // console.log(raw);
  return raw ? toRaw(raw as T) : observed;
}
