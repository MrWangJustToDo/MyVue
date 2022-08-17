import type {
  MyVue_Comment,
  MyVue_Fragment,
  MyVue_Static,
  MyVue_Text,
} from "./symbol";

type VNodeType =
  | string
  | typeof MyVue_Text
  | typeof MyVue_Comment
  | typeof MyVue_Fragment
  | typeof MyVue_Static;

export const createVNode = (
  type: VNodeType,
  props: Record<string, unknown>,
  children
) => {};
