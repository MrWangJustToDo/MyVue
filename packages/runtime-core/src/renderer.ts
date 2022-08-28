import { ShapeFlags } from "./shapeFlags";
import { MyVue_Comment, MyVue_Fragment, MyVue_Text } from "./symbol";
import { isSameVNodeType, normalizeVNode } from "./vnode";

import type { ComponentInstance } from "./component";
import type { VNodeChild, VNode } from "./vnode";

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
    // parentNode: hostParentNode,
    // nextSibling: hostNextSibling,
  } = rendererOptions;

  const mountChildren = (
    children: VNodeChild[],
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      _patch(null, child, container, anchor, parentComponent, isSVG);
    }
  };

  const unmountChildren = (
    children: VNode[],
    parentComponent: ComponentInstance | null
  ) => {
    children.forEach((child) => unmount(child, parentComponent));
  };

  const unmountStatic = (vnode: VNode) => {
    if (vnode.dom) {
      hostRemove(vnode.dom);
    }
  };

  const unmountElement = (
    vnode: VNode,
    parentComponent: ComponentInstance | null
  ) => {
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children as VNode[], parentComponent);
    }
    unmountStatic(vnode);
  };

  const unmountComponent = (
    _vnode: VNode,
    _parentComponent: ComponentInstance | null
  ) => {
    void 0;
  };

  const mountElement = (
    vnode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    const { type, props, shapeFlag, children } = vnode;

    vnode.dom = hostCreateElement(type as string, isSVG);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(vnode.dom as Element, children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(
        children as VNodeChild[],
        vnode.dom as RenderElement,
        anchor,
        parentComponent,
        isSVG
      );
    }

    for (const key in props) {
      if (key !== "ref" && key !== "key") {
        hostPatchProps(vnode.dom as Element, key, null, props[key], isSVG);
      }
    }

    const typedDOM = vnode.dom as RenderElement;

    typedDOM.__vnode__ = vnode;

    hostInsert(typedDOM, container, anchor);
  };

  const mountComponent = (
    vnode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    void 0;
  };

  const patchProps = (
    node: Node,
    vnode: VNode,
    oldProps: VNode["props"],
    newProps: VNode["props"],
    isSVG: boolean
  ) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevValue = oldProps[key];
        const nextValue = newProps[key];
        if (nextValue !== prevValue) {
          hostPatchProps(node as Element, key, prevValue, nextValue, isSVG);
        }
      }
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProps(node as Element, key, oldProps[key], null, isSVG);
        }
      }
    }
  };

  // vue diff
  const patchKeyedChildren = (
    oldChildren: VNode[],
    newChildren: VNodeChild[],
    container: RenderElement,
    parentAnchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    let i = 0;
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;

    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const oldChild = oldChildren[i];
      const newChild = (newChildren[i] = normalizeVNode(newChildren[i]));
      if (isSameVNodeType(oldChild, newChild)) {
        _patch(
          oldChild,
          newChild,
          container,
          parentAnchor,
          parentComponent,
          isSVG
        );
      } else {
        break;
      }
      i++;
    }

    // 2. sync from end
    // (a) (b c)
    // (a) d e (b c)
    while (i <= e1 && i <= e2) {
      const oldChild = oldChildren[e1];
      const newChild = (newChildren[e2] = normalizeVNode(newChildren[e2]));
      if (isSameVNodeType(oldChild, newChild)) {
        _patch(
          oldChild,
          newChild,
          container,
          parentAnchor,
          parentComponent,
          isSVG
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // new added from head or foot
    /**
     * prev: (a b c)
     * next: (a b c) d
     * i=3, e1=2, e2=3
     *
     * prev   (a b c)
     * next b (a b c)
     * i=0, e1=-1, e2=0
     *
     */
    if (i > e1) {
      if (i <= e2) {
        const anchor = newChildren[e2 + 1]
          ? ((newChildren[e2 + 1] as VNode).dom as RenderElement)
          : parentAnchor;
        while (i <= e2) {
          _patch(
            null,
            (newChildren[i] = normalizeVNode(newChildren[i])),
            container,
            anchor,
            parentComponent,
            isSVG
          );
          i++;
        }
      }
    } else if (i > e2) {
      /**
       * prev: (a b c) d
       * next: (a b c)
       * i=3, e1=3, e2=2
       *
       * prev: a (b c)
       * next:   (b c)
       * i=0, e1=0, e2=-1
       *
       */
      while (i <= e1) {
        unmount(oldChildren[i]);
        i++;
      }
    } else {
      /**
       * prev: (a b) c d e   (f g)
       * next: (a b) e d c h (f g)
       * i = 2, e1 = 4, e2 = 5
       */
      const keyToNewIndexMap = new Map<string | number | symbol, number>();
      const keylessNewChildren = Array(newChildren.length);
      const patchedNewChildren = Array(newChildren.length);
      for (let index = i; index < e2; index++) {
        const newChild = (newChildren[i] = normalizeVNode(newChildren[i]));
        if (newChild.key !== null) {
          keyToNewIndexMap.set(newChild.key, index);
        } else {
          keylessNewChildren[index] = newChild;
        }
      }

      for (let index = i; index < e1; index++) {
        const oldChild = oldChildren[index];
        let newChildIndex: number | undefined = undefined;
        if (oldChild.key !== null) {
          newChildIndex = keyToNewIndexMap.get(oldChild.key);
        } else {
          for (let index = i; index < e2; index++) {
            if (
              keylessNewChildren[index] &&
              isSameVNodeType(oldChild, newChildren[index])
            ) {
              newChildIndex = index;
              break;
            }
          }
        }
        if (newChildIndex === undefined) {
          unmount(oldChild);
        } else {
          patchedNewChildren[newChildIndex] = true;
          _patch(
            oldChild,
            newChildren[newChildIndex] as VNode,
            container,
            null,
            parentComponent,
            isSVG
          );
        }
      }

      // TODO
      for (let index = e2; index >= i; index--) {
        const anchor = newChildren[index + 1]
          ? ((newChildren[index + 1] as VNode).dom as RenderElement)
          : parentAnchor;
        const newChild = newChildren[index + 1] as VNode;
        if (patchedNewChildren[index]) {
          // todo
          hostInsert(newChild.dom as RenderElement, container, anchor);
        } else {
          _patch(null, newChild, container, anchor, parentComponent, isSVG);
        }
      }
    }
  };

  const patchChildren = (
    oldVNode: VNode,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    const { children: prevChildren, shapeFlag: prevShapeFlag } = oldVNode;
    const { children: nextChildren, shapeFlag: nextShapeFlag } = newVNode;

    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(prevChildren as VNode[], parentComponent);
      }
      if (prevChildren !== nextChildren) {
        hostSetElementText(container, nextChildren as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(
            prevChildren as VNode[],
            nextChildren as VNodeChild[],
            container,
            anchor,
            parentComponent,
            isSVG
          );
        } else {
          unmountChildren(prevChildren as VNode[], parentComponent);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, "");
        }
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(
            nextChildren as VNodeChild[],
            container,
            anchor,
            parentComponent,
            isSVG
          );
        }
      }
    }
  };

  const patchElement = (
    oldVNode: VNode,
    newVNode: VNode,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    newVNode.dom = oldVNode.dom as Node;

    const prevProps = oldVNode.props;

    const nextProps = newVNode.props;

    patchProps(newVNode.dom, newVNode, prevProps, nextProps, isSVG);

    const typedDOM = newVNode.dom as RenderElement;

    patchChildren(oldVNode, newVNode, typedDOM, anchor, parentComponent, isSVG);

    typedDOM.__vnode__ = newVNode;
  };

  const patchComponent = () => {
    void 0;
  };

  const processElement = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    isSVG = isSVG || newVNode.type === "svg";
    if (oldVNode === null) {
      mountElement(newVNode, container, anchor, parentComponent, isSVG);
    } else {
      patchElement(oldVNode, newVNode, anchor, parentComponent, isSVG);
    }
  };

  const processComment = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null
  ) => {
    if (oldVNode === null) {
      newVNode.dom = hostCreateComment((newVNode.children as string) || "");

      const typedDOM = newVNode.dom as RenderElement;

      typedDOM.__vnode__ = newVNode;

      hostInsert(typedDOM, container, anchor);
    }
  };

  const processFragment = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    if (oldVNode === null) {
      mountChildren(
        newVNode.children as VNodeChild[],
        container,
        anchor,
        parentComponent,
        isSVG
      );
    } else {
      patchChildren(
        oldVNode,
        newVNode,
        container,
        anchor,
        parentComponent,
        isSVG
      );
    }
  };

  const processText = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null
  ) => {
    if (oldVNode) {
      // update
      newVNode.dom = oldVNode.dom;
      if (newVNode.children !== oldVNode.children) {
        const typedDOM = newVNode.dom as Text;
        hostSetText(typedDOM, newVNode.children as string);
      }
    } else {
      // mount
      newVNode.dom = hostCreateText(newVNode.children as string);
      const typedDOM = newVNode.dom as Text;
      hostInsert(typedDOM, container, anchor);
    }
  };

  const processComponent = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    if (oldVNode === null) {
      mountComponent(newVNode, container, anchor, parentComponent, isSVG);
    } else {
      patchComponent();
    }
  };

  const _patch = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null = null,
    parentComponent: ComponentInstance | null = null,
    isSVG = false
  ) => {
    const { type, shapeFlag } = newVNode;

    switch (type) {
      case MyVue_Comment:
        processComment(oldVNode, newVNode, container, anchor);
        break;
      case MyVue_Fragment:
        processFragment(
          oldVNode,
          newVNode,
          container,
          anchor,
          parentComponent,
          isSVG
        );
        break;
      case MyVue_Text:
        processText(oldVNode, newVNode, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(
            oldVNode,
            newVNode,
            container,
            anchor,
            parentComponent,
            isSVG
          );
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(
            oldVNode,
            newVNode,
            container,
            anchor,
            parentComponent,
            isSVG
          );
        }
    }
  };

  const patch = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: RenderElement,
    anchor: RenderElement | null = null,
    parentComponent: ComponentInstance | null = null,
    isSVG = false
  ) => {
    if (oldVNode === newVNode) return;

    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode, parentComponent);
      oldVNode = null;
    }

    _patch(oldVNode, newVNode, container, anchor, parentComponent, isSVG);
  };

  const unmount = (
    oldVNode: VNode,
    parentComponent: ComponentInstance | null = null
  ) => {
    const { type, shapeFlag, children } = oldVNode;
    switch (type) {
      case MyVue_Comment:
        unmountStatic(oldVNode);
        break;
      case MyVue_Fragment:
        unmountChildren(children as VNode[], parentComponent);
        break;
      case MyVue_Text:
        unmountStatic(oldVNode);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          unmountElement(oldVNode, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          unmountComponent(oldVNode, parentComponent);
        }
    }
  };

  const render = (vnode: VNode, container: RenderElement) => {
    patch(container.__vnode__ || null, vnode, container);
    container.__vnode__ = vnode;
  };

  return {
    render,
  };
};
