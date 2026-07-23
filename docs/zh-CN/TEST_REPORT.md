# @dreamer/store 测试报告

[English](../en-US/TEST_REPORT.md) | 中文 (Chinese)

## 📊 测试概览

- **包**：`@dreamer/store`
- **版本**：**1.1.0**（与 `deno.json`/`package.json` 对齐）
- **测试框架**：@dreamer/test@^1.2.3
- **报告日期**：**2026-07-23**
- **测试环境**：Deno 2.9+ / Bun 1.3+ / Node.js 22+

---

## 运行方式

在 **store 包根目录**下执行：

```bash
# Deno
deno task test

# Bun
bun test tests/

# Node.js 22+
npm install
npm run test:node
# 等价于：node --import tsx --test-force-exit test-node.mjs
```

---

## 📈 测试结果

### 运行时兼容性

| 运行时   | 版本   | 通过    | 失败  | 文件数 | 耗时    |
| -------- | ------ | ------- | ----- | ------ | ------- |
| Deno     | 2.9+   | **31**  | **0** | 4      | ~0.2s   |
| Bun      | 1.3+   | **27**  | **0** | 4      | ~0.06s  |
| Node.js  | 22+    | **4/4** | **0** | 4      | ~5s     |

> 4 个测试文件均为纯单元测试——无浏览器测试、无外部服务、无需排除项。
> Deno/Bun 计数因运行器统计口径不同而异（框架清理用例按文件计一次），
> 以 **0 失败** 为不变量。

### 测试文件统计

| #  | 测试文件         | 测试数 | 状态        | 说明                                                                    |
| -- | ---------------- | ------ | ----------- | ----------------------------------------------------------------------- |
| 1  | `mod.test.ts`    | 17     | ✅ 全部通过 | defineStore、persist、边界；store 的 subscribe/getState                 |
| 2  | `view.test.ts`   | 5      | ✅ 全部通过 | useStoreSignal：Signal、按字段 effect、setState、完整 store 形态        |
| 3  | `react.test.ts`  | 5      | ✅ 全部通过 | useStore 契约 + useStore(store) 返回完整 store，可读 state 并调 actions |
| 4  | `preact.test.ts` | 4      | ✅ 全部通过 | useStore 契约 + useStore(store) 返回完整 store，可读 state 并调 actions |

---

## 功能测试详情

### 1. defineStore (mod.test.ts) - 9 个测试

| 测试场景                                                                                       | 状态 |
| ---------------------------------------------------------------------------------------------- | ---- |
| ✅ 仅 state、asObject: false 时返回 [get, set]；get/set 及 set(fn) 正常                        | 通过 |
| ✅ 仅 state、asObject: true（默认）时返回单对象；store.xxx 可读                                | 通过 |
| ✅ 带 getters、asObject: false 时返回 [get, set, getters]；getter 随 state 更新                | 通过 |
| ✅ 带 actions、asObject: false 时返回 [get, set, actions]；action 生效                         | 通过 |
| ✅ 带 getters + actions、asObject: false 时返回 [get, set, getters, actions]                   | 通过 |
| ✅ 同一 key 返回同一实例（单例）                                                               | 通过 |
| ✅ action 内可调用 this.setState 与其它 action（this.otherAction()）                           | 通过 |
| ✅ action 内直接 this.xxx = value 能更新 state（与 view 一致）                                 | 通过 |
| ✅ asObject: true 且带 getters + actions 时单对象 store.xxx / store.double / store.increment() | 通过 |

**实现要点**：

- ✅ defineStore(key, config) 支持 state、getters、actions、persist、asObject
- ✅ 返回的 store 对象提供 subscribe、getState，供 View/React/Preact 响应式使用
- ✅ 元组形态 [get, set, getters?, actions?] 与单对象形态
- ✅ action 上下文 Proxy 支持直接赋值（this.xxx = value）与 setState
- ✅ 同一 key 返回同一 store 实例（全局注册表）

### 2. defineStore persist (mod.test.ts) - 3 个测试

| 测试场景                                                 | 状态 |
| -------------------------------------------------------- | ---- |
| ✅ persist 未传 storage 时使用初始 state                 | 通过 |
| ✅ persist 传入 mock storage 时能恢复并保存              | 通过 |
| ✅ persist 不传 key 时使用 defineStore 的 key 作为存储键 | 通过 |

**实现要点**：

- ✅ 可选 persist.key（默认使用 defineStore 的 key）
- ✅ 可选 persist.storage（默认在可用时使用 localStorage）
- ✅ 初始化时恢复、set 时保存

### 3. defineStore 边界 (mod.test.ts) - 4 个测试

| 测试场景                                                    | 状态 |
| ----------------------------------------------------------- | ---- |
| ✅ state 为空对象 {} 时 get/set 正常                        | 通过 |
| ✅ 连续多次 set 只保留最后一次完整 state                    | 通过 |
| ✅ persist 时 storage.getItem 抛错不崩溃，使用初始 state    | 通过 |
| ✅ persist 时 storage.setItem 抛错不崩溃，内存 state 仍更新 | 通过 |

**实现要点**：

- ✅ 空 state 与连续更新行为正确
- ✅ persist 异常（getItem/setItem 抛错）被捕获，状态保持一致

### 4. View 适配 (view.test.ts) - 5 个测试

| 测试场景                                                            | 状态 |
| ------------------------------------------------------------------- | ---- |
| ✅ useStoreSignal(store) 返回响应式 state 对象，直接读与 store 一致 | 通过 |
| ✅ store.setState 后 state.xxx 为新值，createEffect 可据此响应      | 通过 |
| ✅ 返回对象可调用 setState、actions，与 store 同形                  | 通过 |
| ✅ 按字段拆 signal：只改部分字段时，仅读其他字段的 effect 不重跑    | 通过 |

**实现要点**：

- ✅ useStoreSignal(store) 订阅 store 并返回代理：state 键使用 **@dreamer/view**
  **SignalRef**（**`.value`**），actions/getters/setState 透传至 store。

### 5. React 适配 (react.test.ts) - 5 个测试

| 测试场景                                                                | 状态 |
| ----------------------------------------------------------------------- | ---- |
| ✅ store 含 subscribe 与 getState；getState() 与当前 state 一致         | 通过 |
| ✅ subscribe(listener) 在 setState 时被调用                             | 通过 |
| ✅ useSyncExternalStore 语义：listener 内可读 getState() 得到更新后状态 | 通过 |
| ✅ useStore(store) 返回完整 store，组件可读 state 并调用 actions        | 通过 |

**实现要点**：

- ✅ defineStore 单对象 store 满足 useStore 契约；useStore(store) 返回 store
  自身，可读 state 并调 actions。

### 6. Preact 适配 (preact.test.ts) - 4 个测试

| 测试场景                                                   | 状态 |
| ---------------------------------------------------------- | ---- |
| ✅ store 含 subscribe 与 getState；getState() 一致         | 通过 |
| ✅ subscribe(listener) 在 setState 时被调用                | 通过 |
| ✅ useStore(store) 返回完整 store，可读 state 并调 actions | 通过 |

**实现要点**：

- ✅ 与 React 相同契约；useStore(store) 返回完整 store。

## 测试覆盖分析

### API 覆盖

| API / 行为                                        | 覆盖情况                                                  |
| ------------------------------------------------- | --------------------------------------------------------- |
| defineStore(key, { state })                       | ✅ 元组与单对象返回                                       |
| defineStore 带 getters                            | ✅ [get, set, getters] 与单对象                           |
| defineStore 带 actions                            | ✅ [get, set, actions] 与单对象；setState 与直接 this.xxx |
| defineStore 带 getters + actions                  | ✅ 元组与单对象                                           |
| 同一 key 单例                                     | ✅ 返回同一实例                                           |
| subscribe / getState（响应式）                    | ✅ setState 时通知；getState() 快照                       |
| persist（key、storage、恢复、保存）               | ✅ 恢复、保存、默认 key                                   |
| set(value) 与 set(fn)                             | ✅ 两种形式均测试                                         |
| StoreBuiltIn\<T\>、DefineStoreReturnType\<T, K?\> | ✅ 类型辅助，可选 state 键参，简洁 StoreType 写法         |

### 适配器覆盖

| 适配器         | 覆盖情况                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| View           | ✅ useStoreSignal：SignalRef 按字段、细粒度 effect、setState、完整 store |
| React / Preact | ✅ subscribe、getState；useStore(store) 返回完整 store，state + actions  |

## 优点

1. ✅ **defineStore 完整 API**：state、getters、actions、persist、asObject
2. ✅ **响应式**：store 提供 subscribe、getState，供 View/React/Preact 适配使用
3. ✅ **与 view 一致的 actions**：直接赋值（this.xxx = value）与 setState
4. ✅ **全局单例**：同一 key 返回同一实例
5. ✅ **持久化**：可选 key/storage，初始化恢复、set 时保存；异常被处理
6. ✅ **类型辅助**：StoreBuiltIn\<T\>、DefineStoreReturnType\<T, K?\> 支持简洁
   StoreType 定义
7. ✅ **适配器测试**：view(4)、react(5)、preact(4) 覆盖响应式契约与完整 store
   返回
8. ✅ **100% 通过率**：30 个测试（Deno），27（Bun），0 失败

## 结论

@dreamer/store 已通过全部 31 个测试（Deno），通过率
100%。defineStore（元组与单对象形态）、persist
行为、边界情况、响应式契约（subscribe/getState）以及 View/React/Preact
适配（useStoreSignal、useStore 返回完整 store）均有覆盖。StoreBuiltIn 与
DefineStoreReturnType 支持简洁的 store 类型书写。可用于生产环境。

**总测试数**：31（mod 17 + view 5 + react 5 + preact 4；Bun 按文件集计为 28）。
