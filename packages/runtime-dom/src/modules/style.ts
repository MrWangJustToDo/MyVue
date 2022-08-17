import { isString } from "@my-vue/shared";

export type Style = string | Record<string, string> | null;

export const patchStyle = (el: Element, prevStyle: Style, nextStyle: Style) => {
  const style = (el as HTMLElement).style;
  const isCssString = isString(nextStyle);
  if (nextStyle && !isCssString) {
    for (const key in nextStyle) {
      style.setProperty(key, nextStyle[key] === null ? "" : nextStyle[key]);
    }
    if (prevStyle && !isString(prevStyle)) {
      for (const key in prevStyle) {
        if (nextStyle[key] === null) {
          style.setProperty(key, "");
        }
      }
    }
  } else {
    if (isCssString) {
      if (prevStyle !== nextStyle) {
        style.cssText = nextStyle;
      }
    } else if (prevStyle) {
      el.removeAttribute("style");
    }
  }
};
