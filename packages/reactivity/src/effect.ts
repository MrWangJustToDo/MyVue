import { isArray } from "@my-vue/shared";

import { globalDepsMap } from "./env";
import { EffectFlags } from "./symbol";

let globalEffect: null | ReactiveEffect = null;

export class ReactiveEffect {
  private _active = true;
  private [EffectFlags.Effect_key] = true;
  private _parent: ReactiveEffect | null = null;
  private _depsSetArray: Set<ReactiveEffect>[] = [];

  constructor(
    private _action: () => unknown,
    private _scheduler?: (newValue: unknown, oldValue: unknown) => unknown
  ) {}

  cleanDeps() {
    // delete current effect deps
    this._depsSetArray.forEach((set) => set.delete(this));
    // clean the dep array
    this._depsSetArray.length = 0;
  }

  addDeps(set: Set<ReactiveEffect>) {
    this._depsSetArray.push(set);
  }

  private entryScope() {
    this._parent = globalEffect;
    globalEffect = this;
  }

  private exitScope() {
    globalEffect = this._parent;
    this._parent = null;
  }

  run() {
    this.entryScope();

    this.cleanDeps();

    let re = null;

    try {
      re = this._action();
    } catch (e) {
      console.error(e);
    } finally {
      this.exitScope();
    }

    return re;
  }

  update(newValue?: unknown, oldValue?: unknown) {
    if (!this._active) {
      if (this._scheduler) {
        return this._scheduler(newValue, oldValue);
      } else {
        return this._action();
      }
    }

    this.entryScope();

    this.cleanDeps();

    let re = null;

    try {
      if (this._scheduler) {
        re = this._scheduler(newValue, oldValue);
      } else {
        re = this._action();
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.exitScope();
    }

    return re;
  }

  stop() {
    if (this._active) {
      this._active = false;
      this.cleanDeps();
    }
  }
}

export function track(target: any, type: "get", key: string) {
  if (!globalEffect) return;

  if (!globalDepsMap.has(target)) {
    globalDepsMap.set(target, new Map<string, Set<ReactiveEffect>>());
  }

  const targetMap = globalDepsMap.get(target) as Map<
    string,
    Set<ReactiveEffect>
  >;

  if (!targetMap.has(key)) targetMap.set(key, new Set());

  const depsSet = targetMap.get(key) as Set<ReactiveEffect>;

  trackEffects(depsSet);
}

export function trackEffects(set: Set<ReactiveEffect>) {
  if (!globalEffect) return;

  if (!set.has(globalEffect)) {
    set.add(globalEffect);

    globalEffect.addDeps(set);
  }
}

export function trigger(
  target: any,
  type: "set" | "add" | "delete" | "clear",
  key: string,
  newValue: unknown,
  oldValue: unknown
) {
  const depsMap = globalDepsMap.get(target);
  if (!depsMap) return;
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, _key) => {
      if (_key === "length" || Number(_key) >= (newValue as number)) {
        if (dep) triggerEffects(dep, newValue, oldValue);
      }
    });
  } else {
    const depsSet = depsMap.get(key);
    if (depsSet) triggerEffects(depsSet, newValue, oldValue);
  }
}

export function triggerEffects(
  set: Set<ReactiveEffect>,
  oldValue?: unknown,
  newValue?: unknown
) {
  const allReactiveEffect = new Set(set);
  allReactiveEffect.forEach((reactiveEffect) => {
    if (!Object.is(reactiveEffect, globalEffect)) {
      reactiveEffect.update(oldValue, newValue);
    }
  });
}

export function effect(action: () => void) {
  const effectObject = new ReactiveEffect(action);

  effectObject.run();

  const runner: {
    (oldValue: unknown, newValue: unknown): unknown;
    effect?: ReactiveEffect;
  } = effectObject.update.bind(effectObject);

  runner.effect = effectObject;

  return runner;
}
