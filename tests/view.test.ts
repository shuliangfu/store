/**
 * View 适配测试：useStoreSignal 返回响应式 state，直接读 .xxx 即可在 createEffect 中响应 store 变更
 */

import { describe, expect, it } from "@dreamer/test";
import { defineStore } from "../src/mod.ts";
import { useStoreSignal } from "../src/view.ts";

describe("useStoreSignal (view adapter)", () => {
  const key = "test-view-" + Math.random().toString(36).slice(2);

  it("返回响应式 state 对象，直接读属性与 store 当前 state 一致", () => {
    const store = defineStore(key + "-a", {
      state: { n: 0 },
    }) as {
      n: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { n: number };
    };
    const state = useStoreSignal(store);
    expect(state.n).toBe(0);
  });

  it("store.setState 后读取 state.xxx 得到新值，createEffect 可据此响应", () => {
    const store = defineStore(key + "-b", {
      state: { n: 0 },
    }) as {
      n: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { n: number };
    };
    const state = useStoreSignal(store);
    expect(state.n).toBe(0);
    store.setState({ n: 1 });
    expect(state.n).toBe(1);
    store.setState({ n: 2 });
    expect(state.n).toBe(2);
  });
});
