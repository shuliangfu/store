/**
 * @fileoverview Store 测试
 */

import { describe, expect, it } from "jsr:@dreamer/test@^1.0.0-alpha.1";
import { defineStore } from "../src/mod.ts";

// 定义 Store 类型接口
interface CounterStore {
  count: number;
  increment: () => void;
}

describe("Store", () => {
  describe("defineStore", () => {
    it("应该创建 store", () => {
      const useStore = defineStore<CounterStore>((set, get) => ({
        count: 0,
        increment() {
          this.count++;
        },
      }));

      const store = useStore();
      expect(store.count).toBe(0);
    });

    it("应该更新状态", () => {
      const useStore = defineStore<CounterStore>((set, get) => ({
        count: 0,
        increment() {
          this.count++;
        },
      }));

      const store = useStore();
      store.increment();
      // 重新获取状态以获取最新值
      const updatedStore = useStore();
      expect(updatedStore.count).toBe(1);
    });

    it("应该支持订阅", () => {
      const useStore = defineStore<CounterStore>((set, get) => ({
        count: 0,
        increment() {
          this.count++;
        },
      }));

      let notified = false;
      const store = useStore();
      useStore.subscribe(() => {
        notified = true;
      });

      store.increment();
      expect(notified).toBeTruthy();
    });
  });
});
