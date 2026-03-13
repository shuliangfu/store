/**
 * 示例：View 适配 useStoreSignal(store)
 *
 * 返回与 store 同形的代理，可响应式读 state、可调用 setState / actions / getters。
 * 在 createEffect 里读 storeState.xxx 会被追踪，store 变更时 effect 重新执行。
 *
 * 运行：deno run -A examples/view-adapter.ts
 */

import { defineStore, type DefineStoreReturnType } from "../src/mod.ts";
import { useStoreSignal } from "../src/view.ts";

/** 可选：一个对象写齐 state + getters + actions，内置方法自动带上（有 getter 时想更准可传第二泛型 state 键名） */
type StoreType = DefineStoreReturnType<{
  count: number;
  double: number;
  increment: (step?: number) => void;
}>;

const store = defineStore("counter-view", {
  state: { count: 0 },
  getters: {
    double() {
      return this.count * 2;
    },
  },
  actions: {
    increment(step = 1) {
      this.count += step;
    },
  },
});

// useStoreSignal 返回完整 store 形态：可读 state、可调 actions/getters（asObject 默认，断言为 StoreType 以通过类型检查）
const storeState = useStoreSignal(store as StoreType);

console.log("初始:", storeState.count, "double:", storeState.double);
storeState.increment(2);
console.log("increment(2) 后:", storeState.count, "double:", storeState.double);
storeState.setState({ count: 10 });
console.log("setState({ count: 10 }) 后:", storeState.count);

// 在 @dreamer/view 的 createEffect 里读 storeState.count 即可被追踪，例如：
// createEffect(() => { console.log(storeState.count); });
export { store, storeState };
