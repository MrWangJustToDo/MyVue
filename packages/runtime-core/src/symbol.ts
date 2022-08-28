export const MyVue_Text = Symbol.for("__my_text__");

export const MyVue_Static = Symbol.for("__my_static__");

export const MyVue_Comment = Symbol.for("__my_comment__");

export const MyVue_Fragment = Symbol.for("__my_fragment__");

export const enum VNodeFlags {
  VNode_key = "__my_vnode__",
  Skip_key = "__my_skip__",
  Cloned_key = "__my_cloned__",
  Component_key = "__my_component__",
}
