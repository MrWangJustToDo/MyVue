import { createRenderer } from "@my-vue/runtime-core";

import { nodeApi } from "./nodeApi";
import { patchProps } from "./pathProps";

import type { RendererOptions } from "@my-vue/runtime-core";

export const renderOptions: RendererOptions<Node, Element> = Object.assign(nodeApi, {
  patchProps,
});

export const render = createRenderer<Node, Element>(renderOptions).render;

export * from "@my-vue/runtime-core";
