import { createRenderer } from "@my-vue/runtime-core";

import { nodeApi } from "./nodeApi";
import { patchProps } from "./pathProps";

import type { RendererOptions } from "@my-vue/runtime-core";

export const renderOptions: RendererOptions = Object.assign(nodeApi, {
  patchProps,
});

export const render = createRenderer(renderOptions).render;

export { h, Fragment, Text } from "@my-vue/runtime-core";
