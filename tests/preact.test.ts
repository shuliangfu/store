/**
 * Preact 适配测试：store 的 subscribe/getState 契约 + useStore 返回完整 store 可读 state 并调用 actions
 */

import { describe, expect, it } from "@dreamer/test";
import { defineStore } from "../src/mod.ts";
import { useStore } from "../src/preact.ts";
import { createElement, render } from "preact";

const keyPreact = "test-preact-" + Math.random().toString(36).slice(2);

describe("useStore (preact adapter)", () => {
  it("defineStore 返回的 store 含 subscribe 与 getState，getState() 与 state 一致", () => {
    const store = defineStore(keyPreact + "-a", {
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
    const store = defineStore(keyPreact + "-b", {
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

  it("useStore(store) 返回完整 store，可读 state 并调用 actions", () => {
    if (typeof globalThis.document === "undefined") {
      return; // 无 DOM 时跳过
    }
    type StoreWithInc = {
      n: number;
      setState: (v: unknown) => void;
      subscribe: (fn: () => void) => () => void;
      getState: () => { n: number };
      inc: () => void;
    };
    const store = defineStore(keyPreact + "-c", {
      state: { n: 0 },
      actions: {
        inc() {
          this.n += 1;
        },
      },
    }) as StoreWithInc;
    let result: StoreWithInc | null = null;
    function Comp() {
      result = useStore(store);
      return createElement("span", null, String(result?.n ?? ""));
    }
    const div = globalThis.document.createElement("div");
    render(createElement(Comp, null), div);
    expect(result).toBe(store);
    expect(result).not.toBeNull();
    const s = result as unknown as StoreWithInc;
    expect(s.n).toBe(0);
    s.inc();
    expect(s.n).toBe(1);
    render(null, div);
  });
});
