/**
 * 示例：使用 set、get、api 方式创建 Store
 *
 * 这个示例展示了如何使用传统的 set、get 和 api 参数来创建和管理状态
 */

import { defineStore } from "../src/mod.ts";

// 定义 Store 类型
interface UserStore {
  user: {
    id: string;
    name: string;
    email: string;
    lastLogin?: Date;
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<NonNullable<UserStore["user"]>>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 使用 set、get、api 方式创建 Store
const useUserStore = defineStore<UserStore>((set, get, api) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // 异步 Action - 使用 set 更新状态
  login: async function (email: string, password: string) {
    // 使用 set 更新 loading 状态
    set({ loading: true, error: null });

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("登录失败");
      }

      const user = await response.json();

      // 使用 set 更新状态
      set({
        user,
        isAuthenticated: true,
        loading: false,
      });

      // 使用 api 调用其他方法
      api?.updateUser({ lastLogin: new Date() });
    } catch (error) {
      // 使用 set 更新错误状态
      set({
        loading: false,
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  },

  // 同步 Action - 使用 set 更新状态
  logout: function () {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // 更新部分状态 - 使用 get 获取当前状态，set 更新状态
  updateUser: function (updates) {
    // 使用 get 获取当前状态
    const currentUser = get().user;
    if (currentUser) {
      // 使用 set 更新状态
      set({
        user: { ...currentUser, ...updates },
      });
    }
  },

  // 设置 loading 状态
  setLoading: function (loading: boolean) {
    set({ loading });
  },

  // 设置错误状态
  setError: function (error: string | null) {
    set({ error });
  },
}));

// 使用示例
async function example() {
  // 获取状态
  const state = useUserStore.getState();
  console.log("当前状态:", state);

  // 订阅状态变化
  const unsubscribe = useUserStore.subscribe((state: UserStore) => {
    console.log("状态已更新:", state);
  });

  // 调用方法
  const storeState = useUserStore.getState();
  await storeState.login("user@example.com", "password123");

  // 更新用户信息
  storeState.updateUser({ name: "新用户名" });

  // 登出
  storeState.logout();

  // 取消订阅
  unsubscribe();
}

// 导出供测试使用
export { example, useUserStore };
