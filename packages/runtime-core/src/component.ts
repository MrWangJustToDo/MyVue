import { VNodeFlags } from "./symbol";

import type { VNode } from "./vnode";
import type { ReactiveEffect } from "@my-vue/reactivity";

export type ComponentType = typeof MyVueInternalInstance;

export type ComponentInstance = MyVueInternalInstance & MyVueComponentInstance;

export class MyVueInternalInstance {
  [VNodeFlags.Skip_key] = true;
  [VNodeFlags.Component_key] = true;

  constructor(public readonly props: VNode["props"]) {}
}

export interface MyVueComponentInstance {
  uid: number;
  type: ComponentType;
  parent: MyVueComponentInstance | null;
  root: MyVueComponentInstance;
  self: VNode;
  sibling: VNode;
  child: VNode;
  effect: ReactiveEffect;
  update: () => void;
  render: () => VNode | null;
}
