/**
 * 示例：defineStore 单对象形态（asObject: true，默认）
 *
 * 可直接 store.count、store.increment() 调用
 */

import { defineStore } from "../src/mod.ts";

const store = defineStore("counter-with-this", {
  state: { count: 0, name: "" },
  getters: {
    double() {
      return this.count * 2;
    },
  },
  actions: {
    increment(step = 1) {
      this.count = this.count + step;
    },
    setName(name: string) {
      this.name = name;
    },
  },
}) as {
  count: number;
  name: string;
  double: number;
  setState: (v: unknown) => void;
  increment: (step?: number) => void;
  setName: (name: string) => void;
};

// 直接读 state 与 getter
console.log(store.count, store.double);
store.increment(2);
console.log(store.count, store.double);
store.setName("hello");

export { store };
