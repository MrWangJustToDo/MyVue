import { patchAttrs } from "./modules/attrs";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

import type { EventPatchElement, EventValue } from "./modules/events";
import type { Style } from "./modules/style";

export const patchProps = (
  el: Element,
  key: string,
  prevValue: unknown,
  nextValue: unknown,
  isSVG: boolean
) => {
  if (key === "class") {
    patchClass(el, nextValue as string | null, isSVG);
    return;
  }
  if (key === "style") {
    patchStyle(el, prevValue as Style, nextValue as Style);
    return;
  }
  if (/^on[^a-z]/.test(key)) {
    patchEvent(el as EventPatchElement, key, prevValue as EventValue, nextValue as EventValue);
    return;
  }
  patchAttrs(el, key, prevValue, nextValue, isSVG);
};
