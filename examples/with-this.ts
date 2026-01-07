/**
 * 示例：使用 this 方式创建 Store
 *
 * 这个示例展示了如何直接使用 this 来访问和修改状态，更简洁直观
 *
 * 注意：为了获得完整的 IDE 支持（代码跟踪、类型检查等），
 * 建议使用显式类型定义，如本示例中的 `UserStore` 接口。
 *
 * 使用显式类型定义后，在方法中使用 this 访问属性和调用方法时，
 * IDE 能够正确识别类型并支持代码跟踪（跳转到定义、查找引用等）。
 */

import { defineStore } from "../src/mod.ts";

/**
 * 用户信息类型
 * 定义用户对象的结构
 */
type User = {
  id: string;
  name: string;
  email: string;
  lastLogin?: Date;
};

/**
 * Store 类型定义
 *
 * 使用显式类型定义可以获得完整的 IDE 支持，包括：
 * - 代码跟踪（跳转到定义、查找引用）
 * - 类型检查和自动补全
 * - 方法中 this 的类型识别
 */
interface UserStore {
  // 状态属性
  user: User | null; // 用户信息，可能为 null（未登录时）
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // 方法
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // updateUser 方法：接受部分用户属性来更新用户信息
  // Partial<User> 表示所有属性都是可选的，可以只更新部分属性
  // 例如：updateUser({ name: "新名字" }) 或 updateUser({ email: "new@example.com" })
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 使用 this 方式定义 Store（推荐，更简洁）
// 使用显式类型定义 `<UserStore>` 可以获得完整的 IDE 支持，包括代码跟踪
// 在方法中使用 this 访问属性和调用方法时，IDE 能够正确识别类型并支持代码跟踪
const useUserStore = defineStore<UserStore>((set, get, api) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // 异步 Action - 直接使用 this 修改属性
  login: async function (email: string, password: string) {
    // ✅ 直接使用 this 赋值，自动同步到 store
    this.loading = true;
    this.error = null;

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

      // ✅ 直接使用 this 赋值，自动同步到 store
      this.user = user;
      this.isAuthenticated = true;
      this.loading = false;

      // ✅ 可以使用 this 调用其他方法
      this.updateUser({ lastLogin: new Date() });
    } catch (error) {
      // ✅ 直接使用 this 赋值
      this.loading = false;
      this.error = error instanceof Error ? error.message : "未知错误";
    }
  },

  // 同步 Action - 直接使用 this 修改属性
  logout: function () {
    // ✅ 直接使用 this 赋值
    this.user = null;
    this.isAuthenticated = false;
    this.error = null;
  },

  // 更新部分状态 - 直接使用 this 访问和修改
  updateUser: function (
    updates: Partial<NonNullable<UserStore["user"]>>,
  ) {
    // ✅ 直接使用 this 访问属性
    if (this.user) {
      // ✅ 直接使用 this 修改属性
      this.user = { ...this.user, ...updates };
    }
  },

  // 设置 loading 状态
  setLoading: function (loading: boolean) {
    // ✅ 直接使用 this 赋值
    this.loading = loading;
  },

  // 设置错误状态
  setError: function (error: string | null) {
    // ✅ 直接使用 this 赋值
    this.error = error;
  },
}));

// 使用示例
async function example() {
  // 获取状态
  const state = useUserStore.getState();
  console.log("当前状态:", state);

  // 订阅状态变化（类型自动推断）
  const unsubscribe = useUserStore.subscribe((state) => {
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
