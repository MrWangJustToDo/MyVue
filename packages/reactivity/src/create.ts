import {
  globalReactiveMap,
  globalReadOnlyMap,
  globalShallowReactiveMap,
  globalShallowReadOnlyMap,
} from "./env";
import { generateProxyHandler } from "./handler";

export const getProxyCacheMap = (isShallow: boolean, isReadOnly: boolean) => {
  if (isShallow && isReadOnly) {
    return globalShallowReadOnlyMap;
  }
  if (isShallow) return globalShallowReactiveMap;
  if (isReadOnly) return globalReadOnlyMap;
  return globalReactiveMap;
};

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
  isShallow: boolean,
  isReadOnly: boolean
) {
  return createReactive(
    target,
    getProxyCacheMap(isShallow, isReadOnly),
    generateProxyHandler(isShallow, isReadOnly)
  );
}
