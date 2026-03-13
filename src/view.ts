/**
 * View 响应式适配：useStoreSignal 返回与 store 同形的代理，读 state 响应式、可调用 actions/getters
 *
 * - 读 .count、.name 等 state 字段：走内部 signal，createEffect 里可追踪，store 变更时 effect 重新执行
 * - 读 .setState、.connectWallet 等 actions/getters：透传到原 store，可直接调用
 *
 * @example
 * import { useStoreSignal } from "@dreamer/store/view";
 * import { createEffect } from "@dreamer/view/effect";
 * const storeState = useStoreSignal(myStore);
 * createEffect(() => { console.log(storeState.count); });
 * storeState.increment();  // 调用 action
 */

import { createSignal } from "@dreamer/view/signal";
import type { StoreSubscribe } from "./mod.ts";

/** 带 subscribe 与 getState 的 store（defineStore 单对象形态） */
export type SubscribableStore<T = Record<string, unknown>> = {
  subscribe: StoreSubscribe;
  getState: () => T;
};

/**
 * 返回与 store 同形的代理：state 字段走 signal 实现响应式读取，其余（setState、actions、getters）透传至原 store 可调用
 *
 * @param store - 由 defineStore 返回的 store 对象（含 subscribe、getState、setState、actions、getters）
 * @returns 与 store 同类型 S，读 state 可被 createEffect 追踪，可调用 store 上的方法
 */
export function useStoreSignal<
  S extends object & SubscribableStore<Record<string, unknown>>,
>(store: S): S {
  const [getStateSnapshot, setStateSnapshot] = createSignal(store.getState());
  store.subscribe(() => setStateSnapshot(store.getState()));
  return new Proxy(store, {
    get(target, prop: string) {
      const state = getStateSnapshot();
      if (Object.prototype.hasOwnProperty.call(state, prop)) {
        return state[prop as keyof typeof state];
      }
      return (target as Record<string, unknown>)[prop];
    },
  }) as S;
}
