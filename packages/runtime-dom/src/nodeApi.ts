export const nodeApi = {
  insert: (
    child: Node,
    parent: Element,
    anchor: Node | Element | null | undefined
  ) => {
    parent.insertBefore(child, anchor || null);
  },

  remove: (child: Node) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  createElement: (tag: string, isSVG: boolean) => {
    const el = isSVG
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    return el;
  },

  createText: (text: string) => document.createTextNode(text),

  createComment: (text: string) => document.createComment(text),

  setText: (node: Node, text: string) => {
    node.nodeValue = text;
  },

  setElementText: (el: Element, text: string) => {
    el.textContent = text;
  },

  parentNode: (node: Node) => node.parentNode as Element | null,

  nextSibling: (node: Node) => node.nextSibling,

  querySelector: (selector: string) => document.querySelector(selector),
};
