import { isArray, isInteger, isObject } from "@my-vue/shared";

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
import { ReactiveFlags } from "./symbol";

/**
 * array method track:
 * const data = {a: 1, b: 2};
 * const arr = reactive([data]);
 * usage effect(() => {
 *  if (arr.includes(data)) {
 *    console.log('foo')
 *  }
 * })
 */

// TODO more function
export const generateArrayProxyHandler = () => {
  const methodNames = [
    "includes",
    "indexOf",
    "lastIndexOf",
    "find",
    "findIndex",
    "findLast",
    "findLastIndex",
  ] as const;
  // 这些方法会修改数组  同时也会访问length属性，对于数组的操作可能会死循环

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const noTrackMethodNames = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
  ] as const;
  return methodNames.reduce<
    Partial<Record<typeof methodNames[number], (...args: unknown[]) => unknown>>
  >((p, c) => {
    p[c] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any;
      for (let i = 0; i < this.length; i++) {
        track(arr, "get", i.toString());
      }
      const res = arr[c](...args);
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[c](...args.map(toRaw));
      } else {
        return res;
      }
    };
    return p;
  }, {});
};

const arrayProxyHandler = generateArrayProxyHandler();

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
    key: string | symbol,
    receiver: unknown
  ) {
    if (key === ReactiveFlags.Reactive_key) return !isReadOnly;
    if (key === ReactiveFlags.Readonly_key) return isReadOnly;
    if (key === ReactiveFlags.Shallow_key) return isShallow;
    if (
      key === ReactiveFlags.Raw_key &&
      receiver === getProxyCacheMap(isShallow, isReadOnly).get(target)
    ) {
      return target;
    }

    const res = Reflect.get(target, key, receiver);

    /**
     * TODO: from source code, array function / symbol
     */

    const targetIsArray = isArray(target);

    // 劫持特定的数组方法，使其能够正确的处理原始数据和proxy数据转换以及对应的依赖收集
    if (targetIsArray && Reflect.has(arrayProxyHandler, key)) {
      return Reflect.get(arrayProxyHandler, key, receiver);
    }

    if (!isReadOnly) {
      track(target, "get", key as string);
    }

    if (isShallow) {
      return res;
    }

    if (isRef(res)) {
      return targetIsArray && isInteger(key) ? res : res.value;
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
      key === ReactiveFlags.Reactive_key ||
      key === ReactiveFlags.Readonly_key ||
      key === ReactiveFlags.Shallow_key ||
      key === ReactiveFlags.Raw_key
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

    // 原型链的proxy set方法会按层级触发
    if (Object.is(target, toRaw(receiver))) {
      if (!Object.is(oldValue, value)) {
        trigger(target, "set", key as string, value, oldValue);
      }
    }

    return res;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compose<T extends any[], K>(
  handler: (...args: T) => K,
  ...transform: ((v: K | unknown) => K | any)[]
) {
  return function (...args: T) {
    const res = handler.call(null, ...args);
    return transform.reduce((p, c) => c(p))(res);
  };
}

export const unwrapRefGerHandler = (
  target: Record<string, unknown>,
  key: string,
  receiver: unknown
) => unwrapRef(Reflect.get(target, key, receiver));

export const unwrapRefSetHandler = (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  receiver: unknown
) => {
  const oldValue = target[key as string];

  if (isRef(oldValue) && !isRef(value)) {
    oldValue.value = value;

    return true;
  } else {
    return Reflect.set(target, key, value, receiver);
  }
};
