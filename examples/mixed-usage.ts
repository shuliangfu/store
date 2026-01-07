/**
 * 示例：混合使用 set/get/api 和 this 方式
 *
 * 这个示例展示了可以在同一个 Store 中混合使用不同的方式
 */

import { defineStore } from "../src/mod.ts";

// 定义 Store 类型
interface CounterStore {
  count: number;
  step: number;
  history: number[];

  // Actions
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setStep: (step: number) => void;
  addToHistory: () => void;
  clearHistory: () => void;
}

// 混合使用 set/get/api 和 this 方式
const useCounterStore = defineStore<CounterStore>((set, get, api) => ({
  // 初始状态
  count: 0,
  step: 1,
  history: [],

  // 使用 this 方式（推荐）
  increment: function () {
    // ✅ 直接使用 this 修改属性
    this.count += this.step;
    // ✅ 使用 this 调用其他方法
    this.addToHistory();
  },

  // 使用 this 方式
  decrement: function () {
    // ✅ 直接使用 this 修改属性
    this.count -= this.step;
    // ✅ 使用 this 调用其他方法
    this.addToHistory();
  },

  // 使用 set 方式
  reset: function () {
    // 使用 set 更新状态
    set({ count: 0 });
    // 也可以使用 this
    this.clearHistory();
  },

  // 使用 this 方式
  setStep: function (step: number) {
    // ✅ 直接使用 this 赋值
    this.step = step;
  },

  // 使用 get 和 this 混合方式
  addToHistory: function () {
    // 使用 get 获取当前状态
    const currentCount = get().count;
    // 使用 this 访问和修改属性
    this.history = [...this.history, currentCount];
  },

  // 使用 this 方式
  clearHistory: function () {
    // ✅ 直接使用 this 赋值
    this.history = [];
  },
}));

// 使用示例
function example() {
  // 获取状态
  const state = useCounterStore.getState();
  console.log("当前状态:", state);

  // 订阅状态变化
  const unsubscribe = useCounterStore.subscribe((state: CounterStore) => {
    console.log("状态已更新:", state);
  });

  // 调用方法
  const storeState = useCounterStore.getState();
  storeState.increment();
  storeState.increment();
  storeState.decrement();
  storeState.setStep(5);
  storeState.increment();
  storeState.reset();

  // 取消订阅
  unsubscribe();
}

// 导出供测试使用
export { example, useCounterStore };
