# @dreamer/store

> 与 @dreamer/view store 相同风格的客户端状态管理库：按 key 的全局
> store、getters、actions，以及可选的持久化。

[![JSR](https://jsr.io/badges/@dreamer/store)](https://jsr.io/@dreamer/store)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-18%20passed-brightgreen)](./TEST_REPORT.md)

📖 **文档**：[English](../../README.md) | 中文 (Chinese)

---

## 🎯 功能

- **defineStore(key, config)** — 按 key 创建 store；同一 key
  返回同一实例（全局单例）。
- **state / getters / actions** — `config.state`（必填），可选 `getters`（通过
  `this` 派生），可选 `actions`（直接 `this.xxx = value` 或
  `this.setState`，以及 `this.otherAction()`）。
- **persist** — 可选：初始化时从 storage 恢复、更新时保存；默认 key 为 store 的
  key；默认 storage 为可用的 `localStorage`。
- **返回形态** — `asObject: true`（默认）：单对象（如
  `store.count`、`store.increment()`）。`asObject: false`：元组
  `[get, set, getters?, actions?]`。
- **自动回收** — 在支持 WeakRef/FinalizationRegistry 的运行时中，当不再持有
  store 引用时，会从全局注册表移除该 key；仅清理内存注册表，**不影响** persist
  的 storage 数据。

---

## 📦 安装

```bash
# Deno
deno add jsr:@dreamer/store

# Bun
bunx jsr add @dreamer/store
```

---

## 🌍 环境兼容性

| 环境      | 支持                                              |
| --------- | ------------------------------------------------- |
| Deno 2.6+ | ✅                                                |
| Bun       | ✅                                                |
| 服务端    | ❌（仅客户端；persist 在可用时使用 localStorage） |
| 浏览器    | ✅                                                |

---

## ✨ 特性（详细）

- **Store**
  - `defineStore(key, config)` —
    state（必填）、getters、actions、persist、asObject
  - 同一 key → 同一实例；SPA 页面切换时状态保持
  - action 内：直接赋值（`this.xxx = value`）或 `this.setState(...)`；通过
    `this.otherAction()` 调用其它 action
- **持久化**
  - 可选 `persist.key`（默认 store key）、`persist.storage`（默认
    localStorage）、`serialize` / `deserialize`
  - 初始化时恢复；每次 set 时保存
- **TypeScript**
  - state、getters、actions 及返回形态的完整类型

---

## 🎯 使用场景

- 全局客户端状态（如用户、主题、UI 开关）
- 在路由切换时需保留的 SPA 状态（同一 store 实例）
- 可选的 localStorage 持久化（如用户偏好）

---

## 🚀 快速开始

### 单对象（默认，`asObject: true`）

```typescript
import { defineStore } from "jsr:@dreamer/store";

const store = defineStore("counter", {
  state: { count: 0, name: "" },
  getters: {
    double() {
      return this.count * 2;
    },
  },
  actions: {
    increment(step = 1) {
      this.count = this.count + step;
    },
    setName(name: string) {
      this.name = name;
    },
  },
});

// 读 state 与 getter
console.log(store.count, store.double);
store.increment(2);
store.setName("hello");
```

### 元组（`asObject: false`）：`[get, set, getters?, actions?]`

```typescript
import { defineStore } from "jsr:@dreamer/store";

const [get, set, actions] = defineStore("counter-tuple", {
  state: { count: 0 },
  actions: {
    increment() {
      this.count = this.count + 1;
    },
  },
  asObject: false,
}) as [
  () => { count: number },
  (
    v: { count: number } | ((p: { count: number }) => { count: number }),
  ) => void,
  { increment: () => void },
];

console.log(get().count);
actions.increment();
set({ count: get().count + 1 });
```

### 持久化（如 localStorage）

```typescript
const store = defineStore("theme", {
  state: { theme: "light" as "light" | "dark" },
  actions: {
    setTheme(theme: "light" | "dark") {
      this.theme = theme;
    },
  },
  persist: { key: "my-theme" }, // 可选：storage、serialize、deserialize
});
```

### Actions：直接赋值与调用其它 action

```typescript
defineStore("counter-mixed", {
  state: { count: 0, step: 1, history: [] as number[] },
  actions: {
    increment() {
      this.count = this.count + this.step;
      this.addToHistory();
    },
    addToHistory() {
      this.history = [...this.history, this.count];
    },
    reset() {
      this.count = 0;
      this.clearHistory();
    },
    clearHistory() {
      this.history = [];
    },
  },
  asObject: false,
});
```

---

## 📚 API

### defineStore(key, config)

| 参数              | 类型                                                                | 说明                                                                                                          |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `key`             | `string`                                                            | 唯一 key；同一 key 返回同一 store 实例。未传 `persist.key` 时用作默认持久化 key。                             |
| `config.state`    | `T`（对象）                                                         | 初始 state（必填）。浅拷贝。                                                                                  |
| `config.getters`  | `Record<string, (this: T) => unknown>`                              | 可选。每个 getter 通过 `this` 读当前 state。                                                                  |
| `config.actions`  | `Record<string, (this: Ctx, ...args) => any>`                       | 可选。action 内 `this` 含 state、`setState` 及其它 actions；可写 `this.xxx = value` 或 `this.setState(...)`。 |
| `config.persist`  | `{ key?: string, storage?: StorageLike, serialize?, deserialize? }` | 可选。初始化时恢复；set 时保存。                                                                              |
| `config.asObject` | `boolean`                                                           | 默认 `true`。`true` → 单对象；`false` → 元组 `[get, set, getters?, actions?]`。                               |

**返回**：`asObject: true` 时为单对象；`asObject: false` 时为元组
`[get, set, getters?, actions?]`。

### 自动回收

在支持 WeakRef 与 FinalizationRegistry 的运行时中，注册表对 store 使用弱引用；
当没有任何引用再指向 `defineStore` 的返回值时，GC 会回收该对象并触发回调，
从注册表移除该 key。**仅清理内存注册表**，不会删除 persist 使用的 localStorage
等 storage 中的数据；之后再次 `defineStore(key, config)` 会新建 实例并从 persist
恢复。无单独“移除 store”的 API，一般无需手动清理。

### 类型（导出）

- `StorageLike` — `getItem(key)`、`setItem(key, value)`、可选
  `removeItem(key)`。
- `CreateStorePersistOptions<T>` —
  `key?`、`storage?`、`serialize?`、`deserialize?`。
- `CreateStoreConfig<T, G, A>` — `defineStore` 的 config 类型。
- `StoreActionContextBase<T>`、`StoreActionContext<T, A>`、`StoreGetters<T>`、`StoreActions<T, A>`
  — 用于 getters/actions 类型标注。

---

## 📋 变更日志

### [1.0.0] - 2026-02-19

- **新增**：首个稳定版。defineStore（state、getters、actions、persist、asObject），WeakRef/FinalizationRegistry
  自动回收，完整 TypeScript 类型。
- **变更**：无单独 unregister API；自动回收不清理 persist 存储。

完整历史：[CHANGELOG.md](./CHANGELOG.md)

---

## 📊 测试报告

- **日期**：2026-02-19
- **总计**：18 个测试，18 通过，100%
- **详情**：[docs/zh-CN/TEST_REPORT.md](./TEST_REPORT.md)

---

## 📝 注意事项

- 仅客户端：面向浏览器/SPA；persist 在可用时使用 `localStorage`。
- 全局注册表：同一 `key` 返回同一实例；SPA 页面切换时状态保持；当不再持有 store
  引用时（支持 WeakRef 的运行时）会从注册表自动移除该 key，或页面刷新。
  自动回收仅清理内存注册表，不删除 persist 数据。
- API 与 @dreamer/view store 对齐（action 内直接赋值，getters/actions/persist
  形态一致）。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 许可证

Apache-2.0 — 详见 [LICENSE](../../LICENSE)。

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
