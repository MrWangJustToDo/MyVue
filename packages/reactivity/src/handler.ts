import { isObject } from "@my-vue/shared";

import { track, trigger } from "./effect";
import { isReactive, reactive } from "./reactive";
import { isRef, unwrapRef } from "./ref";
import { REACTIVE_KEY } from "./symbol";

export const createGetHandler = (shallow = false, needTrack = true) => {
  return function (
    target: Record<string, unknown>,
    key: string,
    receiver: unknown
  ) {
    if (key === REACTIVE_KEY) return true;

    let res = Reflect.get(target, key, receiver);

    if (needTrack) {
      track(target, "get", key as string);
    }

    if (!shallow && isObject(res)) res = reactive(res);

    return res;
  };
};

export const createSetHandler = (shallow = false, needTrigger = true) => {
  return function (
    target: Record<string, unknown>,
    key: string,
    value: unknown,
    receiver: unknown
  ) {
    if (key === REACTIVE_KEY) {
      throw new Error(`can not set ${REACTIVE_KEY} field for reactive object`);
    }

    const oldValue = target[key as string];

    if (!shallow && isObject(value) && !isReactive(value)) {
      value = reactive(value);
    }

    const res = Reflect.set(target, key, value, receiver);

    if (needTrigger && !Object.is(oldValue, value)) {
      trigger(target, "set", key as string, value, oldValue);
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
  createGetHandler(true, false),
  unwrapRef
);

export const unwrapRefSetHandler = function (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  receiver: unknown
) {
  if (key === REACTIVE_KEY) {
    throw new Error(`can not set ${REACTIVE_KEY} field for reactive object`);
  }

  const oldValue = target[key as string];

  if (isRef(oldValue) && !isRef(value)) {
    oldValue.value = value;
    return true;
  } else {
    return Reflect.set(target, key, value, receiver);
  }
};
