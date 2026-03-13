/**
 * 示例：Preact 适配 useStore(store)
 *
 * 返回与 store 同形，state 变更时组件重渲染，可直接读 state 并调用 actions/getters。
 *
 * 类型检查：deno check examples/preact-adapter.tsx
 * 运行需在 Preact 项目中引入该组件并挂载。
 */

import { defineStore } from "../src/mod.ts";
import { useStore } from "../src/preact.ts";
import { createElement } from "preact";

const store = defineStore("counter-preact", {
  state: { count: 0 },
  actions: {
    increment() {
      this.count += 1;
    },
  },
}) as unknown as {
  count: number;
  setState: (v: unknown) => void;
  subscribe: (fn: () => void) => () => void;
  getState: () => { count: number };
  increment: () => void;
};

/**
 * 计数器组件：useStore(store) 返回完整 store，可读 state 并调 actions
 */
function Counter() {
  const storeState = useStore(store);
  return createElement(
    "div",
    null,
    createElement("span", null, `count: ${storeState.count}`),
    createElement("button", {
      type: "button",
      onClick: () => storeState.increment(),
    }, "+1"),
  );
}

export { Counter, store };
