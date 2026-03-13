# @dreamer/store 测试报告

[English](../en-US/TEST_REPORT.md) | 中文 (Chinese)

## 测试概览

- **包版本**：@dreamer/store@1.0.0
- **测试库版本**：@dreamer/test@^1.0.15
- **测试框架**：@dreamer/test（兼容 Deno 与 Bun）
- **测试日期**：2026-03-13
- **测试环境**：
  - Deno 2.6+
  - Bun（运行 `bun test` 时）

## 测试结果

### 总体统计

- **总测试数**：27
- **通过**：27 ✅
- **失败**：0
- **通过率**：100% ✅
- **执行时间**：约 7s（Deno）、约 1s（Bun）

### 测试文件统计

| 测试文件         | 测试数 | 状态        | 说明                                                    |
| ---------------- | ------ | ----------- | ------------------------------------------------------- |
| `mod.test.ts`    | 17     | ✅ 全部通过 | defineStore、persist、边界；store 的 subscribe/getState |
| `view.test.ts`   | 2      | ✅ 全部通过 | useStoreSignal（View 适配）：getter 刻度、setState 触发 |
| `react.test.ts`  | 3      | ✅ 全部通过 | useStore 契约：subscribe/getState、setState 通知        |
| `preact.test.ts` | 2      | ✅ 全部通过 | useStore 契约：subscribe/getState、setState 通知        |
| @dreamer/test    | 3      | ✅ 全部通过 | 清理（如浏览器 teardown）                               |

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

### 4. View 适配 (view.test.ts) - 2 个测试

| 测试场景                                                      | 状态 |
| ------------------------------------------------------------- | ---- |
| ✅ useStoreSignal(store) 返回 getter；初次 getter() 为 0      | 通过 |
| ✅ store.setState 后 getter() 自增（createEffect 可据此响应） | 通过 |

**实现要点**：

- ✅ useStoreSignal(store) 订阅 store，返回刻度 getter 供 View createEffect 使用

### 5. React 适配契约 (react.test.ts) - 3 个测试

| 测试场景                                                                | 状态 |
| ----------------------------------------------------------------------- | ---- |
| ✅ store 含 subscribe 与 getState；getState() 与当前 state 一致         | 通过 |
| ✅ subscribe(listener) 在 setState 时被调用                             | 通过 |
| ✅ useSyncExternalStore 语义：listener 内可读 getState() 得到更新后状态 | 通过 |

**实现要点**：

- ✅ defineStore 单对象 store 满足 useStore（useSyncExternalStore）契约

### 6. Preact 适配契约 (preact.test.ts) - 2 个测试

| 测试场景                                           | 状态 |
| -------------------------------------------------- | ---- |
| ✅ store 含 subscribe 与 getState；getState() 一致 | 通过 |
| ✅ subscribe(listener) 在 setState 时被调用        | 通过 |

**实现要点**：

- ✅ 与 React 适配相同的 subscribe/getState 契约，供 Preact useStore 使用

## 测试覆盖分析

### API 覆盖

| API / 行为                          | 覆盖情况                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| defineStore(key, { state })         | ✅ 元组与单对象返回                                       |
| defineStore 带 getters              | ✅ [get, set, getters] 与单对象                           |
| defineStore 带 actions              | ✅ [get, set, actions] 与单对象；setState 与直接 this.xxx |
| defineStore 带 getters + actions    | ✅ 元组与单对象                                           |
| 同一 key 单例                       | ✅ 返回同一实例                                           |
| subscribe / getState（响应式）      | ✅ setState 时通知；getState() 快照                       |
| persist（key、storage、恢复、保存） | ✅ 恢复、保存、默认 key                                   |
| set(value) 与 set(fn)               | ✅ 两种形式均测试                                         |

### 适配器覆盖

| 适配器         | 覆盖情况                                          |
| -------------- | ------------------------------------------------- |
| View           | ✅ useStoreSignal：刻度 getter、setState 触发自增 |
| React / Preact | ✅ subscribe 与 getState 行为（useStore 契约）    |

## 优点

1. ✅ **defineStore 完整 API**：state、getters、actions、persist、asObject
2. ✅ **响应式**：store 提供 subscribe、getState，供 View/React/Preact 适配使用
3. ✅ **与 view 一致的 actions**：直接赋值（this.xxx = value）与 setState
4. ✅ **全局单例**：同一 key 返回同一实例
5. ✅ **持久化**：可选 key/storage，初始化恢复、set 时保存；异常被处理
6. ✅ **适配器测试**：view、react、preact 测试覆盖各适配契约
7. ✅ **100% 通过率**：27 个测试，0 失败

## 结论

@dreamer/store 已通过全部 27 个测试，通过率
100%。defineStore（元组与单对象形态）、persist 行为、边界情况（空 state、连续
set、storage 异常）以及供 View、React、Preact
使用的响应式契约（subscribe/getState）均有覆盖，可用于生产环境。

**总测试数**：27（mod 17 + view 2 + react 3 + preact 2 + 框架清理 3）
