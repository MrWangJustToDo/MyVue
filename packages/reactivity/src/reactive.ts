import { isObject } from "@my-vue/shared";

import { createReactiveWithCache } from "./create";
import { ReactiveFlags } from "./symbol";

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
    if (isReadonly(target)) return target as T;
    return createReactiveWithCache(target, false, true) as T;
  } else {
    throw new Error("readonly() only accept a object value");
  }
}

export function shallowReactive<T>(target: T) {
  if (isObject(target)) {
    if (isReactive(target) && isShallow(target)) return target as T;
    return createReactiveWithCache(target, true, false) as T;
  } else {
    throw new Error("shallowReactive() only accept a object value");
  }
}

export function shallowReadonly<T>(target: T) {
  if (isObject(target)) {
    if (isReadonly(target) && isShallow(target)) return target as T;
    return createReactiveWithCache(target, true, true) as T;
  } else {
    throw new Error("shallowReadonly() only accept a object value");
  }
}

export function isReactive(target: unknown): target is Record<string, unknown> {
  return (
    isObject(target) &&
    typeof target[ReactiveFlags.Reactive_key] === "boolean" &&
    !!target[ReactiveFlags.Reactive_key]
  );
}

export function isReadonly(
  target: unknown
): target is Readonly<Record<string, unknown>> {
  return (
    isObject(target) &&
    typeof target[ReactiveFlags.Readonly_key] === "boolean" &&
    !!target[ReactiveFlags.Readonly_key]
  );
}

export function isShallow(target: unknown): target is Record<string, unknown> {
  return (
    isObject(target) &&
    typeof target[ReactiveFlags.Shallow_key] === "boolean" &&
    !!target[ReactiveFlags.Shallow_key]
  );
}

export function isProxy(target: unknown): target is Record<string, unknown> {
  return isReactive(target) || isReadonly(target);
}

export function toReactive<T>(value: T): T {
  return isObject(value) ? reactive(value) : value;
}

export function toReadonly<T>(value: T): T {
  return isObject(value) ? readonly(value) : value;
}

export function toRaw<T>(observed: T): T {
  const raw = isObject(observed) && observed[ReactiveFlags.Raw_key];
  return raw ? toRaw(raw as T) : observed;
}

export function markRaw<T extends Record<string, unknown>>(
  value: T
): T & { [ReactiveFlags.Skip_key]?: true } {
  Object.defineProperty(value, ReactiveFlags.Skip_key, {
    value,
    configurable: true,
    enumerable: false,
  });
  return value;
}
