/**
 * View 响应式适配：useStoreSignal 返回“响应式 state 对象”，在 createEffect 里直接读 .count、.name 等即可被追踪，store 变更时 effect 重新执行
 *
 * @example
 * import { useStoreSignal } from "@dreamer/store/view";
 * import { createEffect } from "@dreamer/view/effect";
 * const state = useStoreSignal(myStore);
 * createEffect(() => {
 *   console.log(state.count);  // 直接读 state.count，自动监听
 * });
 */

import { createSignal } from "@dreamer/view/signal";
import type { StoreSubscribe } from "./mod.ts";

/** 带 subscribe 与 getState 的 store（defineStore 单对象形态） */
export type SubscribableStore<T = Record<string, unknown>> = {
  subscribe: StoreSubscribe;
  getState: () => T;
};

/**
 * 为 store 生成响应式 state：内部用 signal 存 getState()，读 .xxx 时走 signal 故 createEffect 可追踪
 *
 * @param store - 由 defineStore 返回的 store 对象（含 subscribe、getState）
 * @returns 响应式 state 对象，形如 { count, name, ... }，直接读 state.count 即可在 effect 中响应
 */
export function useStoreSignal<T extends Record<string, unknown>>(
  store: SubscribableStore<T>,
): T {
  const [getState, setState] = createSignal(store.getState());
  store.subscribe(() => setState(store.getState()));
  return new Proxy({} as T, {
    get(_, prop: string) {
      return getState()[prop as keyof T];
    },
  });
}
