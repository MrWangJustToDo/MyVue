import { nodeApi } from "./nodeApi";
import { patchProps } from "./pathProps";

export const renderOptions = Object.assign(nodeApi, { patchProps });
