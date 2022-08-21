import { nodeApi } from "./nodeApi";
import { patchProps } from "./pathProps";

import type { RendererOptions } from "@my-vue/runtime-core";

export const renderOptions: RendererOptions = Object.assign(nodeApi, {
  patchProps,
});
