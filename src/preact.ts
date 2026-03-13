/**
 * Preact 响应式适配：useStore 让组件在 store 变更时重渲染
 *
 * 使用 preact/compat 的 useSyncExternalStore，仅依赖 Preact，无需安装 React。
 *
 * @example
 * import { useStore } from "@dreamer/store/preact";
 * const state = useStore(myStore);
 * return <span>{state.count}</span>;
 */

import { useSyncExternalStore } from "preact/compat";
import type { StoreSubscribe } from "./mod.ts";

/** 带 subscribe + getState 的 store（defineStore asObject 返回的对象） */
export type SubscribableStore<T> = {
  subscribe: StoreSubscribe;
  getState: () => T;
};

/**
 * 订阅 store，state 变更时触发重渲染
 *
 * @param store - 由 defineStore 返回的 store 对象（含 subscribe、getState）
 * @returns 当前 state 快照
 */
export function useStore<T>(store: SubscribableStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getState);
}
