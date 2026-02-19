# @dreamer/store 测试报告

[English](../en-US/TEST_REPORT.md) | 中文 (Chinese)

## 测试概览

- **包版本**：@dreamer/store@1.0.0-beta.3
- **测试库版本**：@dreamer/test@^1.0.9
- **测试框架**：@dreamer/test（兼容 Deno 与 Bun）
- **测试日期**：2026-02-19
- **测试环境**：
  - Deno 2.6+
  - Bun（运行 `bun test` 时）

## 测试结果

### 总体统计

- **总测试数**：18
- **通过**：18 ✅
- **失败**：0
- **通过率**：100% ✅
- **执行时间**：约 6ms（Deno 环境）

### 测试文件统计

| 测试文件      | 测试数 | 状态        | 说明                                           |
| ------------- | ------ | ----------- | ---------------------------------------------- |
| `mod.test.ts` | 17     | ✅ 全部通过 | defineStore / unregisterStore / persist / 边界 |
| @dreamer/test | 1      | ✅ 全部通过 | 清理（如浏览器 teardown）                      |

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
- ✅ 元组形态 [get, set, getters?, actions?] 与单对象形态
- ✅ action 上下文 Proxy 支持直接赋值（this.xxx = value）与 setState
- ✅ 同一 key 返回同一 store 实例（全局注册表）

### 2. unregisterStore (mod.test.ts) - 1 个测试

| 测试场景                                           | 状态 |
| -------------------------------------------------- | ---- |
| ✅ 移除后同一 key 可创建新实例，使用新的初始 state | 通过 |

**实现要点**：

- ✅ unregisterStore(key) 从全局注册表移除 store
- ✅ 再次 defineStore(key, ...) 会创建新实例

### 3. defineStore persist (mod.test.ts) - 3 个测试

| 测试场景                                                 | 状态 |
| -------------------------------------------------------- | ---- |
| ✅ persist 未传 storage 时使用初始 state                 | 通过 |
| ✅ persist 传入 mock storage 时能恢复并保存              | 通过 |
| ✅ persist 不传 key 时使用 defineStore 的 key 作为存储键 | 通过 |

**实现要点**：

- ✅ 可选 persist.key（默认使用 defineStore 的 key）
- ✅ 可选 persist.storage（默认在可用时使用 localStorage）
- ✅ 初始化时恢复、set 时保存

### 4. defineStore 边界 (mod.test.ts) - 4 个测试

| 测试场景                                                    | 状态 |
| ----------------------------------------------------------- | ---- |
| ✅ state 为空对象 {} 时 get/set 正常                        | 通过 |
| ✅ 连续多次 set 只保留最后一次完整 state                    | 通过 |
| ✅ persist 时 storage.getItem 抛错不崩溃，使用初始 state    | 通过 |
| ✅ persist 时 storage.setItem 抛错不崩溃，内存 state 仍更新 | 通过 |

**实现要点**：

- ✅ 空 state 与连续更新行为正确
- ✅ persist 异常（getItem/setItem 抛错）被捕获，状态保持一致

## 测试覆盖分析

### API 覆盖

| API / 行为                          | 覆盖情况                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| defineStore(key, { state })         | ✅ 元组与单对象返回                                       |
| defineStore 带 getters              | ✅ [get, set, getters] 与单对象                           |
| defineStore 带 actions              | ✅ [get, set, actions] 与单对象；setState 与直接 this.xxx |
| defineStore 带 getters + actions    | ✅ 元组与单对象                                           |
| 同一 key 单例                       | ✅ 返回同一实例                                           |
| unregisterStore(key)                | ✅ 移除后可创建新实例                                     |
| persist（key、storage、恢复、保存） | ✅ 恢复、保存、默认 key                                   |
| set(value) 与 set(fn)               | ✅ 两种形式均测试                                         |

### 边界情况覆盖

| 边界情况             | 状态                       |
| -------------------- | -------------------------- |
| 空 state {}          | ✅ 通过                    |
| 连续 set             | ✅ 通过                    |
| storage.getItem 抛错 | ✅ 使用初始 state          |
| storage.setItem 抛错 | ✅ state 仍更新            |
| persist 默认 key     | ✅ 使用 defineStore 的 key |

### 错误处理覆盖

| 场景                 | 状态                       |
| -------------------- | -------------------------- |
| persist getItem 异常 | ✅ 捕获；使用初始 state    |
| persist setItem 异常 | ✅ 捕获；内存 state 仍更新 |

## 优点

1. ✅ **defineStore 完整 API**：state、getters、actions、persist、asObject
2. ✅ **与 view 一致的 actions**：直接赋值（this.xxx = value）与 setState
3. ✅ **全局单例**：同一 key 返回同一实例；unregisterStore 用于清理
4. ✅ **持久化**：可选 key/storage，初始化恢复、set 时保存；异常被处理
5. ✅ **边界测试**：空 state、连续 set、storage 异常
6. ✅ **100% 通过率**：18 个测试，0 失败

## 结论

@dreamer/store 已通过全部 18 个测试，通过率
100%。defineStore（元组与单对象形态）、unregisterStore、persist
行为及边界情况（空 state、连续 set、storage 异常）均有覆盖。实现与 view store
风格一致（action 内直接赋值），可用于生产环境。

**总测试数**：18（mod.test.ts 中 17 个 + 框架清理 1 个）
