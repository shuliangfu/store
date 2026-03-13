/**
 * React 适配测试：store 的 subscribe/getState 行为（useStore 依赖此契约）
 * 不直接导入 react.ts 避免 type-check 依赖 React 类型
 */

import { describe, expect, it } from "@dreamer/test";
import { defineStore } from "../src/mod.ts";

describe("useStore (react adapter)", () => {
  const key = "test-react-" + Math.random().toString(36).slice(2);

  it("defineStore 返回的 store 含 subscribe 与 getState，getState() 与 state 一致", () => {
    const store = defineStore(key + "-a", {
      state: { count: 10 },
    }) as {
      count: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { count: number };
    };
    expect(typeof store.subscribe).toBe("function");
    expect(typeof store.getState).toBe("function");
    expect(store.getState()).toEqual({ count: 10 });
    expect(store.count).toBe(10);
    store.setState({ count: 20 });
    expect(store.getState()).toEqual({ count: 20 });
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
    expect(calls).toBe(0);
    store.setState({ n: 1 });
    expect(calls).toBe(1);
    store.setState({ n: 2 });
    expect(calls).toBe(2);
  });

  it("useSyncExternalStore 语义：用 subscribe + getState 可拿到当前 state", () => {
    const store = defineStore(key + "-c", {
      state: { value: "a" },
    }) as {
      value: string;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { value: string };
    };
    let snapshot = store.getState();
    store.subscribe(() => {
      snapshot = store.getState();
    });
    expect(snapshot.value).toBe("a");
    store.setState({ value: "b" });
    expect(snapshot.value).toBe("b");
  });
});
