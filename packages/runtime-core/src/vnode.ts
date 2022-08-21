import { isArray, isObject, isString } from "@my-vue/shared";

import { ShapeFlags } from "./shapeFlags";
import {
  VNodeFlags,
  MyVue_Comment,
  MyVue_Fragment,
  MyVue_Text,
} from "./symbol";

import type { MyVue_Static } from "./symbol";

type VNodeType =
  | string
  | typeof MyVue_Text
  | typeof MyVue_Comment
  | typeof MyVue_Fragment
  | typeof MyVue_Static;

export type VNode = {
  type: VNodeType;
  key: string | undefined;
  dom: Node | null;
  props: Record<string, unknown>;
  children: null | Array<VNode> | string;
  shapeFlag: ShapeFlags;
  [VNodeFlags.VNode_key]: true;
  [VNodeFlags.Skip_key]: true;
  [VNodeFlags.Cloned_key]?: boolean;
};

export const createVNode = (
  type: VNodeType,
  props: Record<string, unknown> = {},
  children: null | Array<VNode> | string = null
): VNode => {
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  if (children) {
    const childrenIsArray = isArray(children);
    children = childrenIsArray ? children : String(children);
    shapeFlag |= childrenIsArray
      ? ShapeFlags.ARRAY_CHILDREN
      : ShapeFlags.TEXT_CHILDREN;
  }

  const vnode = {
    [VNodeFlags.VNode_key]: true,
    [VNodeFlags.Skip_key]: true,
    dom: null,
    key: props["key"] as string | undefined,
    type,
    props,
    children,
    shapeFlag,
  } as const;

  return vnode;
};

export const cloneVNode = (vnode: VNode) => {
  const clonedVNode = { ...vnode };
  clonedVNode[VNodeFlags.Cloned_key] = true;
  return clonedVNode;
};

export const normalizeVNode = (
  child: VNode[] | VNode | string | null | boolean | symbol
) => {
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
