import { isArray } from "@my-vue/shared";

/* eslint-disable @typescript-eslint/ban-types */
export type EventValue = Function | Function[];

type EventHandler = {
  (e: Event): void;
  value: EventValue | null;
};

export type EventPatchElement = Element & {
  __event__: Record<string, EventHandler>;
};

export const patchEvent = (
  el: EventPatchElement,
  key: string,
  prevValue: EventValue | null,
  nextValue: EventValue | null
) => {
  const eventMap = el.__event__ || (el.__event__ = {});

  const eventInvoker = eventMap[key];

  if (eventInvoker) {
    eventInvoker.value = nextValue;
  } else {
    if (nextValue) {
      const eventName = key.slice(2).toLowerCase();
      const invoker: EventHandler = (e: Event) => {
        if (isArray(invoker.value)) {
          invoker.value.forEach((f) => f(e));
        } else {
          invoker.value?.(e);
        }
      };
      invoker.value = nextValue;
      el.addEventListener(eventName, invoker);
    }
  }
};
