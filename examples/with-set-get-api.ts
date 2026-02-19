/**
 * 示例：使用 defineStore(key, config) 方式创建 Store
 *
 * 与 view store 相同的调用方式：state / getters / actions / persist
 */

import { defineStore } from "../src/mod.ts";

type UserState = {
  user: { id: string; name: string; email: string; lastLogin?: Date } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};
type UserActions = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (
    updates: Partial<{ id: string; name: string; email: string }>,
  ) => void;
};

// 使用 defineStore(key, config)，asObject: false 得到 [get, set, actions]
const result = defineStore("user-store-example", {
  state: {
    user: null as UserState["user"],
    isAuthenticated: false as boolean,
    loading: false as boolean,
    error: null as string | null,
  },
  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error("登录失败");
        const user = await response.json();
        this.user = user;
        this.isAuthenticated = true;
        this.loading = false;
      } catch (e) {
        this.loading = false;
        this.error = e instanceof Error ? e.message : "未知错误";
      }
    },
    logout() {
      this.user = null;
      this.isAuthenticated = false;
      this.error = null;
    },
    updateUser(updates: Partial<{ id: string; name: string; email: string }>) {
      const current = this.user;
      if (current) {
        this.user = { ...current, ...updates };
      }
    },
  },
  asObject: false,
}) as [
  () => UserState,
  (v: UserState | ((p: UserState) => UserState)) => void,
  UserActions,
];
const [get, set, actions] = result;

// 使用示例
async function example() {
  console.log("当前状态:", get());
  await actions.login("user@example.com", "password123");
  console.log("登录后:", get().user);
  actions.updateUser({ name: "新用户名" });
  actions.logout();
}

export { actions, example, get, set };
