import { isArray, isObject, isString } from "@my-vue/shared";

import { ShapeFlags } from "./shapeFlags";
import {
  VNodeFlags,
  MyVue_Comment,
  MyVue_Fragment,
  MyVue_Text,
} from "./symbol";

import type { ComponentType, MyVueComponentInstance } from "./component";
import type { MyVue_Static } from "./symbol";

type VNodeType =
  | string
  | ComponentType
  | typeof MyVue_Text
  | typeof MyVue_Comment
  | typeof MyVue_Fragment
  | typeof MyVue_Static;

export type VNodeChild =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void;

export type VNodeChildren = Array<VNodeChild> | VNodeChild;

export type VNode = {
  type: VNodeType;
  key: string | number | symbol | null;
  dom: Node | null;
  props: Record<string, unknown>;
  children: VNodeChildren;
  shapeFlag: ShapeFlags;
  component: MyVueComponentInstance | null;
  [VNodeFlags.VNode_key]: true;
  [VNodeFlags.Skip_key]: true;
  [VNodeFlags.Cloned_key]?: boolean;
};

export const createVNode = (
  type: VNodeType,
  props: Record<string, unknown> = {},
  children: VNodeChildren = null
): VNode => {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  if (children) {
    const childrenIsArray = isArray(children);
    children = childrenIsArray ? children : String(children);
    shapeFlag |= childrenIsArray
      ? ShapeFlags.ARRAY_CHILDREN
      : ShapeFlags.TEXT_CHILDREN;
  }

  const key =
    typeof props["key"] === "undefined"
      ? null
      : (props["key"] as string | number | symbol);

  const vnode: VNode = {
    [VNodeFlags.VNode_key]: true,
    [VNodeFlags.Skip_key]: true,
    dom: null,
    component: null,
    key,
    type,
    props,
    children,
    shapeFlag,
  };

  return vnode;
};

export const cloneVNode = (vnode: VNode) => {
  const clonedVNode = { ...vnode };
  clonedVNode[VNodeFlags.Cloned_key] = true;
  return clonedVNode;
};

export const normalizeVNode = (child: VNodeChildren) => {
  if (child === null || typeof child === "boolean") {
    return createVNode(MyVue_Comment);
  } else if (isArray(child)) {
    return createVNode(MyVue_Fragment, undefined, child.slice());
  } else if (isVNode(child)) {
    return cloneVNode(child);
  } else {
    return createVNode(MyVue_Text, undefined, String(child));
  }
};

export const isVNode = (
  target: unknown
): target is ReturnType<typeof createVNode> => {
  return isObject(target) && !!target[VNodeFlags.VNode_key];
};

export const isSameVNodeType = (n1: VNode | unknown, n2: VNode | unknown) => {
  if (isVNode(n1) && isVNode(n2)) {
    return n1.type === n2.type && n1?.key === n2?.key;
  }
};
