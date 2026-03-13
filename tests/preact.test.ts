/**
 * Preact 适配测试：store 的 subscribe/getState 行为（useStore 依赖此契约）
 * 不直接导入 preact.ts 避免 type-check 依赖 Preact 类型
 */

import { describe, expect, it } from "@dreamer/test";
import { defineStore } from "../src/mod.ts";

describe("useStore (preact adapter)", () => {
  const key = "test-preact-" + Math.random().toString(36).slice(2);

  it("defineStore 返回的 store 含 subscribe 与 getState，getState() 与 state 一致", () => {
    const store = defineStore(key + "-a", {
      state: { count: 5 },
    }) as {
      count: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { count: number };
    };
    expect(typeof store.subscribe).toBe("function");
    expect(typeof store.getState).toBe("function");
    expect(store.getState()).toEqual({ count: 5 });
    store.setState({ count: 15 });
    expect(store.getState()).toEqual({ count: 15 });
  });

  it("subscribe 在 setState 时被调用", () => {
    const store = defineStore(key + "-b", {
      state: { n: 0 },
    }) as {
      n: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
    };
    let calls = 0;
    store.subscribe(() => {
      calls++;
    });
    store.setState({ n: 1 });
    expect(calls).toBe(1);
  });
});
