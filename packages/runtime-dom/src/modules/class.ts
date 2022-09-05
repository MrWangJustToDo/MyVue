export const patchClass = (el: Element, value: string | null, isSVG = false) => {
  if (value === null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
};
