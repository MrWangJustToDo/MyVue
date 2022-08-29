import { VNodeFlags } from "./symbol";

import type { VNode } from "./vnode";
import type {
  ComputedGetter,
  ReactiveEffect,
  WatchCallback,
  WritableComputedOptions,
} from "@my-vue/reactivity";

export type ComponentType = LegacyOptions<unknown>;

export type ComponentInstance = MyVueInternalInstance & MyVueComponentInstance;

// TODO composition api
export type LegacyOptions<D> = Record<string, unknown> & {
  data?: (this: LegacyOptions<D>, vm: LegacyOptions<D>) => D;
  computed?: Record<
    string,
    ComputedGetter<unknown> | WritableComputedOptions<unknown>
  >;
  methods?: Record<string, (...args: unknown[]) => unknown>;
  watch?: Record<string, WatchCallback>;
  render: () => VNode | null;
  // lifecycle
  beforeCreate?(): void;
  created?(): void;
  beforeMount?(): void;
  mounted?(): void;
  beforeUpdate?(): void;
  updated?(): void;
  activated?(): void;
  deactivated?(): void;
  beforeUnmount?(): void;
  unmounted?(): void;
};

export class MyVueInternalInstance implements MyVueInternalInstance {
  [VNodeFlags.Skip_key] = true;
  [VNodeFlags.Component_key] = true;

  uid = 0;

  props: VNode["props"];

  self: VNode;

  type: ComponentType;

  render: () => VNode | null;

  constructor(
    public readonly vnode: VNode,
    public readonly parent: MyVueComponentInstance | null,
    public readonly root: MyVueComponentInstance | null
  ) {
    const { type, props } = vnode;

    const typedType = type as ComponentType;

    const { render } = typedType;

    this.type = typedType;

    this.props = props;

    this.render = render;

    this.self = vnode;

    vnode.component = this;

    if (!this.root) this.root = this;
  }

  update = () => {
    void 0;
  };
}

export interface MyVueComponentInstance {
  uid: number;
  type: ComponentType;
  parent: MyVueComponentInstance | null;
  root: MyVueComponentInstance | null;
  self: VNode;
  sibling?: VNode;
  child?: VNode;
  effect?: ReactiveEffect;
  update: () => void;
  render: () => VNode | null;
}
