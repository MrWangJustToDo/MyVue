import { ShapeFlags } from "./shapeFlags";
import { MyVue_Comment, MyVue_Fragment, MyVue_Text } from "./symbol";
import { normalizeVNode } from "./vnode";

import type { VNode } from "./vnode";

export type RendererOptions = {
  insert(child: Node, parent: Element, anchor?: Node | Element | null): void;
  remove(child: Node): void;
  createElement(tag: string, isSVG?: boolean): SVGElement | HTMLElement;
  createText(text: string): Text;
  createComment(text: string): Comment;
  setText(node: Node, text: string): void;
  setElementText(node: Element, text: string): void;
  parentNode(node: Node): Element | null;
  nextSibling(node: Node): Node | null;
  querySelector?(selector: string): Element | null;
  patchProps(
    el: Element,
    key: string,
    prevValue: unknown,
    nextValue: unknown,
    isSVG: boolean
  ): void;
};

type RenderElement = Element & { __vnode__: VNode };

export const createRenderer = (rendererOptions: RendererOptions) => {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProps: hostPatchProps,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = rendererOptions;

  const mountChildren = (
    children: VNode[],
    container: RenderElement,
    isSVG: boolean
  ) => {
    children.forEach((child) =>
      patch(null, normalizeVNode(child), container, isSVG)
    );
  };

  const mountElement = (
    vnode: VNode,
    container: RenderElement,
    isSVG: boolean
  ) => {
    const { type, props, shapeFlag, children } = vnode;

    vnode.dom = hostCreateElement(type as string, isSVG);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(vnode.dom as Element, children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children as VNode[], vnode.dom as RenderElement, isSVG);
    }

    for (const key in props) {
      if (key !== "ref" && key !== "key") {
        hostPatchProps(vnode.dom as Element, key, null, props[key], isSVG);
      }
    }

    const typedDOM = vnode.dom as RenderElement;

    typedDOM.__vnode__ = vnode;

    hostInsert(typedDOM, container);
  };

  const processElement = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    isSVG: boolean
  ) => {
    isSVG = isSVG || newVNode.type === "svg";
    if (oldVNode === null) {
      mountElement(newVNode, container, isSVG);
    }
  };

  const processText = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement
  ) => {
    if (oldVNode) {
      // update
      const typedDOM = oldVNode.dom as Text;
      hostSetText(typedDOM, newVNode.children as string);
    } else {
      // mount
      newVNode.dom = hostCreateText(newVNode.children as string);
      const typedDOM = newVNode.dom as Text;
      hostInsert(typedDOM, container);
    }
  };

  const patch = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    isSVG = false
  ) => {
    if (oldVNode === newVNode) return;

    if (
      oldVNode &&
      newVNode &&
      (oldVNode.type !== newVNode.type || oldVNode?.key !== newVNode.key)
    ) {
      unmount(oldVNode);
    }

    const { type, shapeFlag } = newVNode;

    switch (type) {
      case MyVue_Comment:
        break;
      case MyVue_Fragment:
        break;
      case MyVue_Text:
        processText(oldVNode, newVNode, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, isSVG);
        }
    }
  };

  const unmount = (_oldVNode: VNode) => {
    void 0;
  };

  const render = (vnode: VNode, container: RenderElement) => {
    if (vnode === null) {
      if (container.__vnode__) {
        unmount(container.__vnode__);
      }
    } else {
      patch(container.__vnode__ || null, vnode, container);
    }
  };

  return {
    render,
  };
};
