import { isObject, isArray } from "@my-vue/shared";

import { trackEffects, triggerEffects } from "./effect";
import { unwrapRefGerHandler, unwrapRefSetHandler } from "./handler";
import { isReactive, reactive } from "./reactive";
import { RefFlags } from "./symbol";

import type { ReactiveEffect } from "./effect";

export interface Ref<T = unknown> {
  value: T;
  [RefFlags.Ref_key]: true;
}

export type UnwrapRef<T> = T extends Ref<infer V> ? UnwrapRef<V> : T;

export function ref<T>(value: T): Ref<UnwrapRef<T>>;
export function ref<T = any>(): Ref<T | undefined>;
export function ref<T>(value?: unknown) {
  if (isRef<T>(value)) return value;
  return new RefImpl(value) as Ref<UnwrapRef<T>>;
}

export function isRef<T>(value: Ref<T> | unknown): value is Ref<T> {
  return isObject(value) && typeof value[RefFlags.Ref_key] !== "undefined";
}

export function toRefs(reactiveValue: ReturnType<typeof reactive> | unknown) {
  if (isObject(reactiveValue)) {
    if (isReactive(reactiveValue)) {
      if (isArray(reactiveValue)) {
        return reactiveValue.map((_, index) => toRef(reactiveValue, index));
      }
      return Object.keys(reactiveValue).reduce<
        Record<string, ReturnType<typeof toRef>>
      >((p, c) => ({ ...p, [c]: toRef(reactiveValue, c) }), {});
    } else {
      throw new Error("expects a reactive object but received a plain object");
    }
  }
  throw new Error("expects a reactive object but received a plain value");
}

// 支持解构一层 就是把原始的ReactiveObject的属性访问转换到target.value的形式访问
export function toRef(object: Record<string, unknown>, key: string | number) {
  const value = object[key];
  if (isRef(value)) return value;
  return new ObjectRefImpl(object, key);
}

export function unwrapRef<T>(refObject: Ref<T> | T) {
  if (isRef<T>(refObject)) return refObject.value;
  return refObject;
}

export function proxyRefs(objectWithRefs: Record<string, unknown>) {
  if (isObject(objectWithRefs)) {
    if (isReactive(objectWithRefs)) return objectWithRefs;
    return new Proxy(objectWithRefs, {
      get: unwrapRefGerHandler,
      set: unwrapRefSetHandler,
    });
  }
  throw new Error("expect a object but received a plain value");
}

class RefImpl {
  private _value: unknown;
  public readonly [RefFlags.Ref_key] = true;
  public readonly _depsSet: Set<ReactiveEffect> = new Set();
  constructor(private _rawValue: unknown) {
    if (isObject(_rawValue)) {
      this._value = reactive(_rawValue);
    } else {
      this._value = _rawValue;
    }
  }

  get value() {
    trackEffects(this._depsSet);

    return this._value;
  }

  set value(newValue) {
    if (!Object.is(newValue, this._rawValue)) {
      this._rawValue = newValue;

      this._value = isObject(newValue) ? reactive(newValue) : newValue;

      triggerEffects(this._depsSet);
    }
  }

  toString() {
    return this._value;
  }
}

class ObjectRefImpl {
  public readonly [RefFlags.Ref_key] = true;
  constructor(
    private readonly _object: Record<string, unknown>,
    private readonly _key: string | number
  ) {}

  get value() {
    return this._object[this._key];
  }

  set value(newValue) {
    this._object[this._key] = newValue;
  }
}
