# 变更日志

@dreamer/store 的所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.2] - 2026-03-14

### 新增

- **类型辅助**：`StoreBuiltIn<T>` 与 `DefineStoreReturnType<T, K?>`，用于简洁的
  store 类型定义；可选第二泛型为 state 键名（省略则按非函数键推断）。
- 测试报告与文档更新：30 个测试（Deno）、27（Bun）；View/React/Preact 适配测试及
  完整 store 返回行为已写入文档。

---

## [1.0.1] - 2026-03-13

### 新增

- **响应式**：store 对象（`asObject: true` 时）提供 `subscribe(listener)` 与
  `getState()`，用于框架集成。
- **框架适配**：`@dreamer/store/view`（useStoreSignal）、`@dreamer/store/react`（useStore）、`@dreamer/store/preact`（useStore）。
- 新增 view、react、preact 适配相关测试。

### 变更

- **View 适配**：`useStoreSignal(store)` 改为返回响应式 state 对象，不再返回刻度
  getter。在 `createEffect` 中直接读取 `state.count`（或任意
  `state.xxx`）即可响应 store 更新，无需先调用 getter。

---

## [1.0.0] - 2026-02-19

### 新增

首个稳定版本。客户端状态管理，与 @dreamer/view store 同风格 API。

#### 核心 API

- **defineStore(key, config)**
  - 使用唯一 `key` 定义 store；同一 key 返回同一实例（按 key 单例），适合按 key
    共享状态的 code-split 场景。
  - **state**（必填）：初始状态对象；内部对状态做浅拷贝。
  - **getters**（可选）：派生只读值；每个 getter 为函数，`this` 指向当前
    state；返回值作为 getter 暴露。
  - **actions**（可选）：可读写 state 的方法；`this` 为包含当前
    state、`setState` 及其他 actions
    的上下文（可互相调用）。支持直接赋值（`this.xxx = value`）与
    `this.setState(value | updater)` 合并更新，与 @dreamer/view store 一致。
  - **persist**（可选）：初始化时从 storage 恢复状态，每次 `setState`
    后写入。支持 `key`（存储键，默认用 store 的
    key）、`storage`（StorageLike，默认在存在时使用
    `globalThis.localStorage`）、`serialize` / `deserialize`（默认 JSON）。
  - **asObject**（可选，默认 `true`）：为 `true` 时返回单对象（state +
    `setState` + getters + actions）；为 `false` 时返回元组
    `[get, set, getters?, actions?]`。
  - 返回类型：元组或
    `StoreAsObjectStateOnly`、`StoreAsObjectWithGetters`、`StoreAsObject`、`StoreAsObjectWithGettersAndActions`
    之一，由 config 决定。
  - 无单独「移除 store」API：在支持 WeakRef/FinalizationRegistry
    的运行时中，用户不再持有返回值后由 GC 自动从注册表清理。

#### 类型与接口

- **StorageLike**：持久化存储接口（`getItem`、`setItem`，可选 `removeItem`）。
- **CreateStorePersistOptions<T>**：persist 的
  `key`、`storage`、`serialize`、`deserialize`。
- **CreateStoreConfig<T, G, A>**：defineStore 的
  `state`、`getters`、`actions`、`persist`、`asObject`。
- **StoreGetters<T>**、**StoreActionContextBase<T>**、**StoreActionContext<T,
  A>**、**StoreActions<T, A>**：getters/actions 及其 `this` 上下文类型。
- **StoreAsObjectStateOnly<T>**、**StoreAsObjectWithGetters<T,
  G>**、**StoreAsObject<T, A>**、**StoreAsObjectWithGettersAndActions<T, G,
  A>**：`asObject: true` 时的返回形态类型。

#### 行为与环境

- **全局注册表**：store 实例按字符串 key
  存放在全局注册表（Symbol.for），多模块使用同一 key 时共享同一 store。
- **自动回收**：在支持 WeakRef 与 FinalizationRegistry 的运行时中，注册表对
  store 使用弱引用；当用户不再持有 defineStore 的返回值时，由 GC
  触发回调从注册表移除该
  key。不支持时注册表为强引用。自动回收**仅清理内存注册表**，不会删除 persist
  使用的 localStorage 等 storage 中的数据；下次 `defineStore(key, config)`
  会新建实例并照常从 persist 恢复。
- **仅客户端**：本库面向客户端（浏览器）状态，不保证服务端行为。
- **持久化**：配置 `persist` 且未提供自定义 `storage` 时，在存在时使用
  `globalThis.localStorage`；否则跳过持久化。序列化默认 JSON，支持自定义
  `serialize` / `deserialize`。
- **兼容性**：Deno 2.6+、Bun 1.3.5+ 及浏览器（在可用时使用 localStorage
  做持久化）。

### 兼容性

- Deno 2.6+
- Bun 1.3.5+
- 浏览器（持久化时使用 localStorage）
