import { MyVueInternalInstance, shouldUpdateComponent, updatePropsAndAttrs } from "./component";
import { queueJob } from "./scheduler";
import { ShapeFlags } from "./shapeFlags";
import { MyVue_Comment, MyVue_Fragment, MyVue_Text } from "./symbol";
import { isSameVNodeType, normalizeVNode } from "./vnode";

import type { ComponentInstance } from "./component";
import type { VNodeChild, VNode, HostRenderNode, HostRenderElement } from "./vnode";

export type RendererOptions<HostNode = HostRenderNode, HostElement = HostRenderElement> = {
  insert(child: HostNode, parent: HostElement, anchor?: HostNode | null): void;
  remove(child: HostNode): void;
  createElement(tag: string, isSVG?: boolean): HostElement;
  createText(text: string): HostNode;
  createComment(text: string): HostNode;
  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;
  parentNode(node: HostNode): HostElement | null;
  nextSibling(node: HostNode): HostNode | null;
  querySelector?(selector: string): HostElement | null;
  patchProps(
    el: HostElement,
    key: string,
    prevValue: unknown,
    nextValue: unknown,
    isSVG: boolean
  ): void;
};

export type Render<HostElement = HostRenderElement> = (
  vnode: VNode,
  container: HostElement
) => void;

export function createRenderer<HostNode = HostRenderNode, HostElement = HostRenderElement>(
  rendererOptions: RendererOptions<HostNode, HostElement>
): {
  render: Render<HostElement>;
};
export function createRenderer<HostNode = Node, HostElement = Element>(
  rendererOptions: RendererOptions<HostNode, HostElement>
): {
  render: Render<HostElement>;
};
// TODO
export function createRenderer(rendererOptions: RendererOptions): { render: Render } {
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
    nextSibling: hostNextSibling,
  } = rendererOptions;

  const unmountChildren = (children: VNode[], parentComponent: ComponentInstance | null) => {
    children.forEach((child) => unmount(child, parentComponent));
  };

  const unmountFragment = (vnode: VNode, parentComponent: ComponentInstance | null) => {
    vnode.node && hostRemove(vnode.node);
    vnode.anchor && hostRemove(vnode.anchor);
    unmountChildren(vnode.children as VNode[], parentComponent);
  };

  const unmountStatic = (vnode: VNode) => {
    if (vnode.node) {
      hostRemove(vnode.node);
    }
  };

  const unmountElement = (vnode: VNode, parentComponent: ComponentInstance | null) => {
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children as VNode[], parentComponent);
    }
    unmountStatic(vnode);
  };

  const unmountComponent = (_vnode: VNode, _parentComponent: ComponentInstance | null) => {
    void 0;
  };

  const mountChildren = (
    children: VNodeChild[],
    container: HostRenderElement,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      patch(null, child, container, anchor, parentComponent, isSVG);
    }
  };

  const mountElement = (
    vnode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    const { type, props, shapeFlag, children } = vnode;

    vnode.node = hostCreateElement(type as string, isSVG);

    const typedNode = vnode.node as HostRenderNode;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(typedNode, children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children as VNodeChild[], typedNode, null, parentComponent, isSVG);
    }

    for (const key in props) {
      if (key !== "ref" && key !== "key") {
        hostPatchProps(vnode.node, key, null, props[key], isSVG);
      }
    }

    typedNode.__vnode__ = vnode;

    hostInsert(typedNode, container, anchor);
  };

  const mountComponent = (
    vnode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    const componentInstance = new MyVueInternalInstance(vnode, parentComponent);

    vnode.component = componentInstance;

    const componentAction = () => {
      if (!componentInstance.isMounted) {
        const subTree = componentInstance.render();
        const children = subTree;
        patch(null, children, container, anchor, componentInstance, isSVG);
        componentInstance.isMounted = true;
      } else {
        const { next, vnode } = componentInstance;
        if (next) {
          updateComponentPreRender(componentInstance, vnode, next);
        }
        const oldChildren = componentInstance.child as VNode;
        const subTree = componentInstance.render();
        const newChildren = subTree;
        patch(oldChildren, newChildren, container, anchor, componentInstance, isSVG);
      }
    };

    componentInstance.createEffectUpdate(componentAction, () => {
      queueJob(componentInstance.update);
    });

    componentInstance.update();
  };

  const patchProps = (
    node: HostRenderElement,
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
          hostPatchProps(node, key, prevValue, nextValue, isSVG);
        }
      }
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProps(node, key, oldProps[key], null, isSVG);
        }
      }
    }
  };

  // vue diff
  const patchKeyedChildren = (
    oldChildren: VNode[],
    newChildren: VNodeChild[],
    container: HostRenderNode,
    parentAnchor: HostRenderNode | null,
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
        patch(oldChild, newChild, container, null, parentComponent, isSVG);
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
        patch(oldChild, newChild, container, null, parentComponent, isSVG);
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
          ? ((newChildren[e2 + 1] as VNode).node as HostRenderNode)
          : parentAnchor;
        // TODO if this vnode is a component vnode, should think
        while (i <= e2) {
          patch(
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
      if (i === e1 && i === e2) {
        patch(oldChildren[i], newChildren[i] as VNode, container, null, parentComponent, isSVG);
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
              if (keylessNewChildren[index] && isSameVNodeType(oldChild, newChildren[index])) {
                newChildIndex = index;
                break;
              }
            }
          }
          if (newChildIndex === undefined) {
            unmount(oldChild);
          } else {
            patchedNewChildren[newChildIndex] = true;
            patch(
              oldChild,
              newChildren[newChildIndex] as VNode,
              container,
              null,
              parentComponent,
              isSVG
            );
          }
        }

        // move and mount
        for (let index = e2; index >= i; index--) {
          const anchor = newChildren[index + 1]
            ? ((newChildren[index + 1] as VNode).node as HostRenderNode)
            : parentAnchor;
          const newChild = newChildren[index + 1] as VNode;
          if (patchedNewChildren[index]) {
            // TODO
            move(newChild, container, anchor);
          } else {
            patch(null, newChild, container, anchor, parentComponent, isSVG);
          }
        }
      }
    }
  };

  const patchChildren = (
    oldVNode: VNode,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
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
          mountChildren(nextChildren as VNodeChild[], container, anchor, parentComponent, isSVG);
        }
      }
    }
  };

  const patchElement = (
    oldVNode: VNode,
    newVNode: VNode,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    newVNode.node = oldVNode.node;

    const prevProps = oldVNode.props;

    const nextProps = newVNode.props;

    const typedNode = newVNode.node as HostRenderNode;

    patchChildren(oldVNode, newVNode, typedNode, null, parentComponent, isSVG);

    patchProps(typedNode, newVNode, prevProps, nextProps, isSVG);

    typedNode.__vnode__ = newVNode;
  };

  const updateComponentPreRender = (
    instance: MyVueInternalInstance,
    oldVNode: VNode,
    newVNode: VNode
  ) => {
    instance.next = null;
    instance.vnode = newVNode;
    updatePropsAndAttrs(instance, oldVNode, newVNode);
  };

  const updateComponent = (oldVNode: VNode, newVNode: VNode) => {
    const instance = (newVNode.component = oldVNode.component) as MyVueInternalInstance;
    instance.next = newVNode;
    if (shouldUpdateComponent(oldVNode, newVNode)) {
      instance.update();
    } else {
      instance.vnode = newVNode;
    }
  };

  const processElement = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
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
    container: HostRenderElement,
    anchor: HostRenderNode | null
  ) => {
    if (oldVNode === null) {
      newVNode.node = hostCreateComment((newVNode.children as string) || "");

      const typedNode = newVNode.node as HostRenderNode;

      typedNode.__vnode__ = newVNode;

      hostInsert(typedNode, container, anchor);
    } else {
      newVNode.node = oldVNode.node;

      const typedNode = newVNode.node as HostRenderNode;

      typedNode.__vnode__ = newVNode;
    }
  };

  const processFragment = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    const fragmentStartAnchor = (newVNode.node = oldVNode?.node
      ? oldVNode.node
      : hostCreateComment("start fragment"));

    fragmentStartAnchor.__vnode__ = newVNode;

    const fragmentEndAnchor = (newVNode.anchor = oldVNode?.anchor
      ? oldVNode.anchor
      : hostCreateComment("end fragment"));

    fragmentEndAnchor.__vnode__ = newVNode;

    if (oldVNode === null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        newVNode.children as VNodeChild[],
        container,
        fragmentEndAnchor,
        parentComponent,
        isSVG
      );
    } else {
      patchChildren(oldVNode, newVNode, container, fragmentEndAnchor, parentComponent, isSVG);
    }
  };

  const processText = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null
  ) => {
    if (oldVNode) {
      // update
      newVNode.node = oldVNode.node;
      if (newVNode.children !== oldVNode.children) {
        const typedNode = newVNode.node as HostRenderNode;
        hostSetText(typedNode, newVNode.children as string);
      }
    } else {
      // mount
      newVNode.node = hostCreateText(newVNode.children as string);
      const typedNode = newVNode.node as HostRenderNode;
      hostInsert(typedNode, container, anchor);
    }
  };

  const processComponent = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null,
    parentComponent: ComponentInstance | null,
    isSVG: boolean
  ) => {
    if (oldVNode === null) {
      mountComponent(newVNode, container, anchor, parentComponent, isSVG);
    } else {
      updateComponent(oldVNode, newVNode);
    }
  };

  const move = (vnode: VNode, container: HostRenderElement, anchor: HostRenderNode | null) => {
    void 0;
  };

  const unmount = (oldVNode: VNode, parentComponent: ComponentInstance | null = null) => {
    const { type, shapeFlag } = oldVNode;
    switch (type) {
      case MyVue_Text:
      case MyVue_Comment:
        unmountStatic(oldVNode);
        break;
      case MyVue_Fragment:
        unmountFragment(oldVNode, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          unmountElement(oldVNode, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          unmountComponent(oldVNode, parentComponent);
        }
    }
  };

  const getNextHostNode = (vnode: VNode): HostRenderNode | null => {
    if (vnode.component) {
      return getNextHostNode(vnode.component.child as VNode);
    } else {
      return hostNextSibling((vnode.anchor || vnode.node) as HostRenderNode);
    }
  };

  const patch = (
    oldVNode: VNode | null,
    newVNode: VNode,
    container: HostRenderElement,
    anchor: HostRenderNode | null = null,
    parentComponent: ComponentInstance | null = null,
    isSVG = false
  ) => {
    if (oldVNode === newVNode) return;

    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      anchor = getNextHostNode(oldVNode);
      unmount(oldVNode, parentComponent);
      oldVNode = null;
    }

    const { type, shapeFlag } = newVNode;

    switch (type) {
      case MyVue_Comment:
        processComment(oldVNode, newVNode, container, anchor);
        break;
      case MyVue_Fragment:
        processFragment(oldVNode, newVNode, container, anchor, parentComponent, isSVG);
        break;
      case MyVue_Text:
        processText(oldVNode, newVNode, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor, parentComponent, isSVG);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(oldVNode, newVNode, container, anchor, parentComponent, isSVG);
        }
    }
  };

  const render = (vnode: VNode, container: HostRenderElement, isSVG = false) => {
    if (vnode === null) {
      if (container.__vnode__) unmount(container.__vnode__, null);
    } else {
      patch(container.__vnode__ || null, vnode, container, null, null, isSVG);
    }
    container.__vnode__ = vnode;
  };

  return {
    render,
  };
}
