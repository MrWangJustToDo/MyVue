import { isArray, isObject } from "@my-vue/shared";

import { createVNode, isVNode } from "./vnode";

export function h(type: any, propsOrChildren?: any, children?: any) {
  const length = arguments.length;
  if (length === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, {}, [propsOrChildren]);
      }
      // props without children
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, {}, propsOrChildren);
    }
  } else {
    if (length > 3) {
      // eslint-disable-next-line prefer-rest-params
      children = Array.from(arguments).slice(2);
    } else if (length === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
