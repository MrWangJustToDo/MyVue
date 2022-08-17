import { isFunction } from "@my-vue/shared";

import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import { ComputedFlags } from "./symbol";

export type ComputedGetter<T> = (...args: any[]) => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export const computed = <T>(
  getterOrOption: WritableComputedOptions<T> | ComputedGetter<T>
) => {
  let getter: (...args: any[]) => T = () => void 0;
  let setter: (v: T) => void = () => void 0;
  if (isFunction(getterOrOption)) {
    getter = getterOrOption;
  } else {
    getter = getterOrOption.get;
    setter = getterOrOption.set;
  }

  return new ComputedRefImpl(getter, setter);
};

class ComputedRefImpl {
  private _dirty = true;
  private _effect: ReactiveEffect;
  private [ComputedFlags.Computed_key] = true;
  private _value: unknown | null = null;
  private _depsSet: Set<ReactiveEffect> = new Set();

  constructor(
    private _getter: () => unknown,
    private _setter: (v: unknown) => unknown
  ) {
    this._effect = new ReactiveEffect(_getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerEffects(this._depsSet);
      }
    });
  }

  get value() {
    trackEffects(this._depsSet);

    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }

    return this._value;
  }

  set value(v) {
    // TODO
    this._setter(v);
  }
}
