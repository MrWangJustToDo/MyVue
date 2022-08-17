export const patchAttrs = (
  el: Element,
  key: string,
  oldValue: unknown,
  newValue: unknown,
  isSVG: boolean
) => {
  if (oldValue) {
    if (key in el && !isSVG) {
      (el as any)[key] = "";
    } else {
      el.removeAttribute(key);
    }
  }
  if (newValue !== undefined && newValue !== null) {
    if (key in el && !isSVG) {
      (el as any)[key] = newValue;
    } else {
      el.setAttribute(key, String(newValue));
    }
  }
};
