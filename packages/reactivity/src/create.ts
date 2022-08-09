import { globalReactiveMap } from "./env";

export function createReactive<T extends Record<string, unknown>>(
  target: T,
  cacheMap: WeakMap<T, T>,
  proxyHandler: ProxyHandler<T>
) {
  if (cacheMap.has(target)) return cacheMap.get(target) as T;

  const proxy = new Proxy(target, proxyHandler);

  cacheMap.set(target, proxy);

  return proxy;
}

export function createReactiveWithCache<T extends Record<string, unknown>>(
  target: T,
  proxyHandler: ProxyHandler<T>
) {
  return createReactive(target, globalReactiveMap, proxyHandler);
}
