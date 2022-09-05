export function isObject(target: any): target is Record<string, unknown> {
  return typeof target === "object" && target !== null;
}

export function isFunction(target: unknown): target is (...args: unknown[]) => unknown {
  return typeof target === "function";
}

export function isArray(target: unknown): target is Array<unknown> {
  return Array.isArray(target);
}

export function isSymbol(target: unknown): target is symbol {
  return typeof target === "symbol";
}

export function isString(target: unknown): target is string {
  return typeof target === "string";
}

export function isInteger(target: unknown): target is number {
  return Number.isInteger(Number(target));
}

export function isNumber(target: unknown): target is number {
  return typeof target === "number";
}

export function isCollection(target: unknown): target is Iterable<unknown> {
  return (
    target instanceof Map ||
    target instanceof Set ||
    target instanceof WeakMap ||
    target instanceof WeakSet
  );
}

export const isNormalEquals = (
  src: Record<string, unknown> | string | number | boolean | null,
  target: Record<string, unknown> | string | number | boolean | null
) => {
  if (typeof src === "object" && typeof target === "object" && src !== null && target !== null) {
    const srcKeys = Object.keys(src);
    const targetKeys = Object.keys(target);
    if (srcKeys.length !== targetKeys.length) return false;
    let res = true;
    for (const key in src) {
      res = res && Object.is(src[key], target[key]);
      if (!res) return res;
    }
    return res;
  }

  return Object.is(src, target);
};
