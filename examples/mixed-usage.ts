/**
 * 示例：defineStore 元组形态，action 内直接 this.xxx 赋值并调用 this.otherAction()（与 view store 一致）
 */

import { defineStore } from "../src/mod.ts";

type State = { count: number; step: number; history: number[] };
type Actions = {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setStep: (step: number) => void;
  addToHistory: () => void;
  clearHistory: () => void;
};

const result = defineStore("counter-mixed", {
  state: { count: 0, step: 1, history: [] as number[] },
  actions: {
    increment() {
      this.count = this.count + this.step;
      this.addToHistory();
    },
    decrement() {
      this.count = this.count - this.step;
      this.addToHistory();
    },
    reset() {
      this.count = 0;
      this.clearHistory();
    },
    setStep(step: number) {
      this.step = step;
    },
    addToHistory() {
      this.history = [...this.history, this.count];
    },
    clearHistory() {
      this.history = [];
    },
  },
  asObject: false,
}) as [() => State, (v: State | ((p: State) => State)) => void, Actions];
const [get, , actions] = result;

function example() {
  console.log("当前状态:", get());
  actions.increment();
  actions.increment();
  actions.decrement();
  actions.setStep(5);
  actions.increment();
  actions.reset();
}

export { actions, example, get };
