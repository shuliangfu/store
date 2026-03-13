/**
 * React 响应式适配：useStore 让组件在 store 变更时重渲染，返回完整 store 可读 state 并调用 actions/getters
 *
 * 使用 useSyncExternalStore，兼容 React 18+。
 *
 * @example
 * import { useStore } from "@dreamer/store/react";
 * const storeState = useStore(myStore);
 * return <span>{storeState.count}</span>;
 * storeState.increment();
 */

import { useSyncExternalStore } from "react";
import type { StoreSubscribe } from "./mod.ts";

/** 带 subscribe + getState 的 store（defineStore asObject 返回的对象） */
export type SubscribableStore<T> = {
  subscribe: StoreSubscribe;
  getState: () => T;
};

/**
 * 订阅 store，state 变更时触发重渲染；返回与 store 同形，可读 state 并调用 setState、actions、getters
 *
 * @param store - 由 defineStore 返回的 store 对象（含 subscribe、getState、setState、actions、getters）
 * @returns 与 store 同类型，state 变更时触发重渲染，可直接调用 store 上的方法
 */
export function useStore<
  S extends object & SubscribableStore<Record<string, unknown>>,
>(store: S): S {
  return useSyncExternalStore(store.subscribe, () => store, () => store) as S;
}
