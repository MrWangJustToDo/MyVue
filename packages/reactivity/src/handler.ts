import { isArray, isObject } from "@my-vue/shared";

import { getProxyCacheMap } from "./create";
import { track, trigger } from "./effect";
import {
  reactive,
  isReadonly as isReadOnlyFunction,
  isShallow as isShallowFunction,
  toRaw,
  readonly,
} from "./reactive";
import { isRef, unwrapRef } from "./ref";
import { REACTIVE_KEY, READONLY_KEY, ROW_KEY, SHALLOW_KEY } from "./symbol";

export const generateProxyHandler = (
  isShallow = false,
  isReadOnly = false
): ProxyHandler<Record<string, unknown>> => {
  return {
    get: createGetHandler(isShallow, isReadOnly),
    set: createSetHandler(isShallow, isReadOnly),
  };
};

export const createGetHandler = (isShallow: boolean, isReadOnly: boolean) => {
  return function (
    target: Record<string, unknown>,
    key: string,
    receiver: unknown
  ) {
    if (key === REACTIVE_KEY) return !isReadOnly;
    if (key === READONLY_KEY) return isReadOnly;
    if (key === SHALLOW_KEY) return isShallow;
    if (
      key === ROW_KEY &&
      receiver === getProxyCacheMap(isShallow, isReadOnly).get(target)
    ) {
      return target;
    }

    const res = Reflect.get(target, key, receiver);

    /**
     * TODO: from source code, array function / symbol
     */

    if (!isReadOnly) {
      track(target, "get", key as string);
    }

    if (isShallow) {
      return res;
    }

    if (isRef(res)) {
      return res.value;
    }

    if (isObject(res)) {
      return isReadOnly ? readonly(res) : reactive(res);
    }

    return res;
  };
};

export const createSetHandler = (isShallow: boolean, isReadOnly: boolean) => {
  return function (
    target: Record<string, unknown>,
    key: string,
    value: unknown,
    receiver: unknown
  ) {
    if (
      key === REACTIVE_KEY ||
      key === READONLY_KEY ||
      key === SHALLOW_KEY ||
      key === ROW_KEY
    ) {
      throw new Error(`can not set internal ${key} field for current object`);
    }

    if (isReadOnly) {
      throw new Error(`can not set ${key} field for readonly object`);
    }

    let oldValue = target[key as string];

    // TODO from source code
    if (isReadOnlyFunction(oldValue) && isRef(oldValue) && !isRef(value)) {
      return false;
    }

    // TODO from source code
    if (!isShallow) {
      if (!isShallowFunction(value) && !isReadOnlyFunction(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    } else {
      void 0;
    }

    const res = Reflect.set(target, key, value, receiver);

    // TODO
    if (Object.is(target, toRaw(receiver))) {
      if (!Object.is(oldValue, value)) {
        trigger(target, "set", key as string, value, oldValue);
      }
    }

    return res;
  };
};

function compose<T extends any[], K>(
  handler: (...args: T) => K,
  ...transform: ((v: K | unknown) => K | any)[]
) {
  return function (...args: T) {
    const res = handler.call(null, ...args);
    return transform.reduce((p, c) => c(p))(res);
  };
}

export const unwrapRefGerHandler = compose(
  (target: Record<string, unknown>, key: string, receiver: unknown) =>
    Reflect.get(target, key, receiver),
  unwrapRef
);

export const unwrapRefSetHandler = function (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  receiver: unknown
) {
  const oldValue = target[key as string];

  if (isRef(oldValue) && !isRef(value)) {
    oldValue.value = value;

    return true;
  } else {
    return Reflect.set(target, key, value, receiver);
  }
};
