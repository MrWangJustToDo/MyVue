export function isObject(target: any): target is Record<string, unknown> {
  return typeof target === "object" && target !== null;
}

export function isFunction(
  target: unknown
): target is (...args: unknown[]) => unknown {
  return typeof target === "function";
}

export function isArray(target: unknown): target is Array<unknown> {
  return Array.isArray(target);
}
