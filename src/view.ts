/**
 * View 响应式适配：useStoreSignal 返回与 store 同形的代理，读 state 响应式、可调用 actions/getters
 *
 * - 读 .count、.name 等 state 字段：按字段拆成独立 signal，仅该字段变化时依赖它的 effect 才重跑
 * - 读 .setState、.connectWallet 等 actions/getters：透传到原 store，可直接调用
 *
 * @example
 * import { useStoreSignal } from "@dreamer/store/view";
 * import { createEffect } from "@dreamer/view/effect";
 * const storeState = useStoreSignal(myStore);
 * createEffect(() => { console.log(storeState.count); });  // 只有 count 变时才跑
 * storeState.increment();  // 调用 action
 */

import { createSignal } from "@dreamer/view/signal";
import type { StoreSubscribe } from "./mod.ts";

/** 带 subscribe 与 getState 的 store（defineStore 单对象形态） */
export type SubscribableStore<T = Record<string, unknown>> = {
  subscribe: StoreSubscribe;
  getState: () => T;
};

/** 单字段 signal：getter + setter */
type FieldSignal = [() => unknown, (v: unknown) => void];

/**
 * 返回与 store 同形的代理：每个 state 字段对应独立 signal，仅该字段变化时依赖它的 effect 才重跑；其余透传
 *
 * @param store - 由 defineStore 返回的 store 对象（含 subscribe、getState、setState、actions、getters）
 * @returns 与 store 同类型 S，读 state 可被 createEffect 追踪，可调用 store 上的方法
 */
export function useStoreSignal<
  S extends object & SubscribableStore<Record<string, unknown>>,
>(store: S): S {
  const state = store.getState();
  const stateKeys = Object.keys(state);
  const signals: Record<string, FieldSignal> = {};
  const lastValues: Record<string, unknown> = {};

  for (const key of stateKeys) {
    const [get, set] = createSignal(state[key as keyof typeof state]);
    signals[key] = [get, set];
    lastValues[key] = state[key as keyof typeof state];
  }

  store.subscribe(() => {
    const newState = store.getState();
    const keysToUpdate = Object.keys(newState);
    for (const key of keysToUpdate) {
      const newVal = newState[key as keyof typeof newState];
      if (!(key in signals)) {
        const [get, set] = createSignal(newVal);
        signals[key] = [get, set];
        lastValues[key] = newVal;
        continue;
      }
      if (newVal !== lastValues[key]) {
        lastValues[key] = newVal;
        signals[key][1](newVal);
      }
    }
  });

  return new Proxy(store, {
    get(target, prop: string) {
      if (signals[prop]) {
        return signals[prop][0]();
      }
      return (target as Record<string, unknown>)[prop];
    },
  }) as S;
}
