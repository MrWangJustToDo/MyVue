import { proxyRefs, reactive, ReactiveEffect, shallowReactive, toRaw } from "@my-vue/reactivity";
import { isFunction, isNormalEquals } from "@my-vue/shared";

import { VNodeFlags } from "./symbol";
import { normalizeVNode } from "./vnode";

import type { VNode, VNodeChild } from "./vnode";
import type { ComputedGetter, WatchCallback, WritableComputedOptions } from "@my-vue/reactivity";

let uid = 0;

export type ComponentType = LegacyOptions<Record<string, unknown>> & CompositionOptions;

export type ComponentInstance = MyVueInternalInstance;

// TODO composition api
export type LegacyOptions<D> = Record<string, unknown> & {
  props?: Record<string, unknown>;
  data?: (this: MyVueInternalInstance, vm: MyVueInternalInstance) => D;
  computed?: Record<string, ComputedGetter<unknown> | WritableComputedOptions<unknown>>;
  methods?: Record<string, (...args: unknown[]) => unknown>;
  watch?: Record<string, WatchCallback>;
  render: () => VNodeChild;
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

export type CompositionOptions = {
  setup: (
    props?: Record<string, unknown>,
    context?: Record<string, unknown>
  ) => Record<string, unknown | (() => unknown)> | (() => VNodeChild);
};

const MyVueInstanceProxyHandler: ProxyHandler<MyVueInternalInstance> = {
  get: (target, key) => {
    const { props, data, setupState } = target;
    if (Reflect.has(data, key)) {
      return data[key.toString()];
    }
    if (Reflect.has(setupState, key)) {
      return setupState[key.toString()];
    }
    if (Reflect.has(props, key)) {
      return props[key.toString()];
    }
  },
  set: (target, key, newValue) => {
    const { props, data, setupState } = target;
    if (Reflect.has(data, key)) {
      data[key.toString()] = newValue;
      return true;
    }
    if (Reflect.has(setupState, key)) {
      setupState[key.toString()] = newValue;
      return true;
    }
    if (Reflect.has(props, key)) {
      console.warn(`can not set props to a new value`);
      return false;
    }
    return false;
  },
};

const getPropsAndAttrs = (vnode: VNode) => {
  const { type, props: rawProps } = vnode;
  const { props: propsOptions = {} } = type as ComponentType;
  const props: VNode["props"] = {};
  const attrs: VNode["props"] = {};
  for (const key in rawProps) {
    if (Reflect.has(propsOptions, key)) {
      // TODO type check
      props[key] = rawProps[key];
    } else {
      attrs[key] = rawProps[key];
    }
  }

  return {
    props,
    attrs,
  };
};

export class MyVueInternalInstance {
  [VNodeFlags.Skip_key] = true;
  [VNodeFlags.Component_key] = true;

  uid: number;

  type: ComponentType;

  root: MyVueInternalInstance;

  data: Record<string, unknown>;

  setupState: Record<string, unknown>;

  refs: Record<string, unknown>;

  props: Record<string, unknown>;

  attrs: Record<string, unknown>;

  proxy: MyVueInternalInstance;

  // for update
  next?: VNode | null;

  child?: VNode | null;

  effect?: ReactiveEffect;

  render: () => VNode;

  renderCount: number;

  isMounted = false;

  isUnmounted = false;

  isDeactivated = false;

  constructor(public vnode: VNode, public readonly parent: MyVueInternalInstance | null) {
    const { type } = vnode;

    const typedType = type as ComponentType;

    const { render } = typedType;

    this.uid = uid++;

    this.type = typedType;

    this.props = {};

    this.attrs = {};

    this.data = {};

    this.setupState = {};

    this.refs = {};

    this.proxy = this;

    // will wrapper by `normalizeVNode()`
    this.render = render as () => VNode;

    this.renderCount = 0;

    this.root = parent?.root || this;

    this.createRenderProxy();

    this.createPropsAndAttrs();

    this.createReactiveData();

    this.createSetupState();

    this.createContextRender();
  }

  createRenderProxy() {
    this.proxy = new Proxy(this, MyVueInstanceProxyHandler);
  }

  createPropsAndAttrs() {
    const { props, attrs } = getPropsAndAttrs(this.vnode);

    this.props = shallowReactive(props);

    this.attrs = attrs;
  }

  createSetupState() {
    const { props } = this;
    const { setup } = this.type;
    if (setup) {
      const result = setup(props);
      if (isFunction(result)) {
        // make sure render will return a valid vnode
        this.render = () => normalizeVNode(result());
      } else {
        this.setupState = proxyRefs(result);
      }
    }
  }

  createReactiveData() {
    const { proxy } = this;
    const { data } = this.type;
    this.data = reactive<Record<string, unknown>>(data?.call(proxy, proxy) || {});
  }

  createContextRender() {
    const renderContext = this.proxy;

    const originalRender = this.render;

    this.render = () => {
      // make sure render will return a valid vnode
      const rendered = normalizeVNode(originalRender.call(renderContext));
      this.child = rendered;
      this.renderCount++;
      return rendered;
    };
  }

  createEffectUpdate(action: () => void, scheduler: () => void) {
    this.effect = new ReactiveEffect(action, scheduler);

    this.update = () => this.effect?.run();
  }

  update() {
    void 0;
  }
}

export const shouldUpdateComponent = (oldVNode: VNode, newVNode: VNode) => {
  const { props: prevProps, children: prevChildren } = oldVNode;
  const { props: nextProps, children: nextChildren } = newVNode;

  if (prevChildren || nextChildren) return true;

  if (prevProps === nextProps) return false;

  return !isNormalEquals(prevProps, nextProps);
};

export const updatePropsAndAttrs = (
  instance: MyVueInternalInstance,
  oldVNode: VNode,
  newVNode: VNode
) => {
  const { props } = instance;
  const prevProps = toRaw(props);
  const { props: nextProps, attrs: nextAttrs } = getPropsAndAttrs(newVNode);
  instance.attrs = nextAttrs;
  for (const key in nextProps) {
    props[key] = nextProps[key];
  }
  for (const key in prevProps) {
    if (!Reflect.has(nextProps, key)) {
      delete props[key];
    }
  }
};
