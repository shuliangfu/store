/**
 * @fileoverview Store 测试 — defineStore(key, config)，自动回收无单独 API
 */

import { describe, expect, it } from "@dreamer/test";
import { defineStore } from "../src/mod.ts";

describe("defineStore", () => {
  const key = "test-store-" + Math.random().toString(36).slice(2);

  it("仅 state、asObject: false 时返回 [get, set]", () => {
    const result = defineStore(key + "-1", {
      state: { count: 0 },
      asObject: false,
    }) as [
      () => { count: number },
      (
        v: { count: number } | ((p: { count: number }) => { count: number }),
      ) => void,
    ];
    const [get, set] = result;

    expect(get().count).toBe(0);
    set({ count: 1 });
    expect(get().count).toBe(1);
    set((prev: { count: number }) => ({ ...prev, count: prev.count + 1 }));
    expect(get().count).toBe(2);
  });

  it("仅 state、asObject: true（默认）时返回单对象", () => {
    const store = defineStore(key + "-obj", {
      state: { count: 0 },
    }) as { count: number; setState: (v: unknown) => void };

    expect(store.count).toBe(0);
    store.setState({ count: 3 });
    expect(store.count).toBe(3);
  });

  it("带 getters、asObject: false 时返回 [get, set, getters]", () => {
    const result = defineStore(key + "-g", {
      state: { count: 2 },
      getters: {
        double() {
          return this.count * 2;
        },
      },
      asObject: false,
    }) as [
      () => { count: number },
      (v: unknown) => void,
      { double: () => number },
    ];
    const [get, set, getters] = result;

    expect(get().count).toBe(2);
    expect(getters.double()).toBe(4);
    set({ count: 5 });
    expect(getters.double()).toBe(10);
  });

  it("带 actions、asObject: false 时返回 [get, set, actions]", () => {
    const result = defineStore(key + "-a", {
      state: { count: 0 },
      actions: {
        increment(step = 1) {
          this.setState({ ...this, count: this.count + step });
        },
      },
      asObject: false,
    }) as [
      () => { count: number },
      (v: unknown) => void,
      { increment: (step?: number) => void },
    ];
    const [get, set, actions] = result;

    expect(get().count).toBe(0);
    actions.increment();
    expect(get().count).toBe(1);
    actions.increment(2);
    expect(get().count).toBe(3);
  });

  it("带 getters + actions、asObject: false 时返回 [get, set, getters, actions]", () => {
    const result = defineStore(key + "-ga", {
      state: { count: 1 },
      getters: {
        double() {
          return this.count * 2;
        },
      },
      actions: {
        increment() {
          this.setState({ ...this, count: this.count + 1 });
        },
      },
      asObject: false,
    }) as [
      () => { count: number },
      (v: unknown) => void,
      { double: () => number },
      { increment: () => void },
    ];
    const [get, set, getters, actions] = result;

    expect(get().count).toBe(1);
    expect(getters.double()).toBe(2);
    actions.increment();
    expect(get().count).toBe(2);
    expect(getters.double()).toBe(4);
  });

  it("同一 key 返回同一实例", () => {
    const k = key + "-same";
    const r1 = defineStore(k, { state: { x: 0 }, asObject: false }) as [
      () => { x: number },
      (v: unknown) => void,
    ];
    const [get1, set1] = r1;
    const r2 = defineStore(k, { state: { x: 99 }, asObject: false }) as [
      () => { x: number },
      (v: unknown) => void,
    ];
    const [get2, set2] = r2;

    set1({ x: 1 });
    expect(get1().x).toBe(1);
    expect(get2().x).toBe(1);
    set2({ x: 2 });
    expect(get1().x).toBe(2);
  });

  it("action 内可调用 this.setState 与其它 action", () => {
    const result = defineStore(key + "-chain", {
      state: { count: 0 },
      actions: {
        add(_n: number) {
          this.setState({ ...this, count: this.count + 2 });
        },
        addTwo() {
          (this as unknown as { add: (n: number) => void }).add(2);
        },
      },
      asObject: false,
    }) as [
      () => { count: number },
      (v: unknown) => void,
      { addTwo: () => void },
    ];
    const [get, , actions] = result;

    actions.addTwo();
    expect(get().count).toBe(2);
  });

  it("action 内直接 this.xxx = value 能更新 state（与 view 一致）", () => {
    const result = defineStore(key + "-direct", {
      state: { count: 0, name: "" },
      actions: {
        setCount(n: number) {
          this.count = n;
        },
        setName(name: string) {
          this.name = name;
        },
        reset() {
          this.count = 0;
          this.name = "";
        },
      },
      asObject: false,
    }) as [
      () => { count: number; name: string },
      (v: unknown) => void,
      {
        setCount: (n: number) => void;
        setName: (s: string) => void;
        reset: () => void;
      },
    ];
    const [get, , actions] = result;

    expect(get().count).toBe(0);
    expect(get().name).toBe("");
    actions.setCount(5);
    expect(get().count).toBe(5);
    actions.setName("hello");
    expect(get().name).toBe("hello");
    actions.reset();
    expect(get().count).toBe(0);
    expect(get().name).toBe("");
  });

  it("asObject: true 且带 getters + actions 时单对象可 store.xxx / store.double() / store.increment()", () => {
    const store = defineStore(key + "-obj-ga", {
      state: { count: 1 },
      getters: {
        double() {
          return this.count * 2;
        },
      },
      actions: {
        increment() {
          this.count = this.count + 1;
        },
      },
    }) as {
      count: number;
      double: number;
      setState: (v: unknown) => void;
      increment: () => void;
    };

    expect(store.count).toBe(1);
    expect(store.double).toBe(2);
    store.increment();
    expect(store.count).toBe(2);
    expect(store.double).toBe(4);
  });
});

describe("defineStore persist", () => {
  const storageKey = "store-persist-test";
  const store: Record<string, string> = {};
  const mockStorage: import("../src/mod.ts").StorageLike = {
    getItem(k: string) {
      return store[k] ?? null;
    },
    setItem(k: string, v: string) {
      store[k] = v;
    },
  };

  it("persist 未传 storage 时使用初始 state", () => {
    const k = "persist-no-storage-" + Math.random().toString(36).slice(2);
    const result = defineStore(k, {
      state: { count: 0 },
      persist: { key: storageKey },
      asObject: false,
    }) as [() => { count: number }, (v: unknown) => void];
    const [get] = result;
    expect(get().count).toBe(0);
  });

  it("persist 传入 mock storage 时能恢复并保存", () => {
    const k = "persist-mock-" + Math.random().toString(36).slice(2);
    store[storageKey] = JSON.stringify({ count: 42 });

    const result = defineStore(k, {
      state: { count: 0 },
      persist: { key: storageKey, storage: mockStorage },
      asObject: false,
    }) as [() => { count: number }, (v: unknown) => void];
    const [get, set] = result;

    expect(get().count).toBe(42);
    set({ count: 100 });
    expect(store[storageKey]).toBe(JSON.stringify({ count: 100 }));
  });

  it("persist 不传 key 时使用 defineStore 的 key 作为存储键", () => {
    const k = "persist-default-key-" + Math.random().toString(36).slice(2);
    store[k] = JSON.stringify({ count: 88 });

    const result = defineStore(k, {
      state: { count: 0 },
      persist: { storage: mockStorage },
      asObject: false,
    }) as [() => { count: number }, (v: unknown) => void];
    const [get, set] = result;

    expect(get().count).toBe(88);
    set({ count: 99 });
    expect(store[k]).toBe(JSON.stringify({ count: 99 }));
  });
});

describe("defineStore 边界", () => {
  const key = "edge-" + Math.random().toString(36).slice(2);

  it("state 为空对象 {} 时 get/set 正常", () => {
    const result = defineStore(key + "-empty", {
      state: {} as Record<string, number>,
      asObject: false,
    }) as [() => Record<string, number>, (v: Record<string, number>) => void];
    const [get, set] = result;

    expect(get()).toEqual({});
    set({ a: 1 });
    expect(get()).toEqual({ a: 1 });
  });

  it("连续多次 set 只保留最后一次完整 state", () => {
    const result = defineStore(key + "-multi", {
      state: { count: 0 },
      asObject: false,
    }) as [() => { count: number }, (v: { count: number }) => void];
    const [get, set] = result;

    set({ count: 1 });
    set({ count: 2 });
    set({ count: 3 });
    expect(get().count).toBe(3);
  });

  it("persist 时 storage.getItem 抛错不崩溃，使用初始 state", () => {
    const k = key + "-getitem-throw";
    const badStorage: import("../src/mod.ts").StorageLike = {
      getItem() {
        throw new Error("getItem failed");
      },
      setItem() {},
    };

    const result = defineStore(k, {
      state: { count: 10 },
      persist: { key: "bad", storage: badStorage },
      asObject: false,
    }) as [() => { count: number }, (v: unknown) => void];
    const [get] = result;
    expect(get().count).toBe(10);
  });

  it("persist 时 storage.setItem 抛错不崩溃，state 仍更新", () => {
    const k = key + "-setitem-throw";
    const badStorage: import("../src/mod.ts").StorageLike = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error("setItem failed");
      },
    };

    const result = defineStore(k, {
      state: { count: 0 },
      persist: { key: "bad2", storage: badStorage },
      asObject: false,
    }) as [() => { count: number }, (v: unknown) => void];
    const [get, set] = result;
    set({ count: 7 });
    expect(get().count).toBe(7);
  });
});
