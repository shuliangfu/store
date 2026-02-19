# Store 使用示例

本目录包含了 `@dreamer/store` 的不同使用方式示例，用于演示类型推断和 API 使用。

## 示例文件

### 1. `with-set-get-api.ts` - 使用 set/get/api 方式

这个示例展示了传统的状态管理方式，使用 `set`、`get` 和 `api`
参数来更新和访问状态。

**特点**：

- 使用 `set()` 函数更新状态
- 使用 `get()` 函数获取当前状态
- 使用 `api` 参数调用其他方法

**适用场景**：

- 需要精确控制状态更新的场景
- 需要获取完整状态后再更新的场景
- 从其他状态管理包迁移的场景

### 2. `with-this.ts` - 使用 this 方式（推荐）

这个示例展示了更简洁的状态管理方式，直接使用 `this` 来访问和修改状态。

**特点**：

- 直接使用 `this.property = value` 修改属性
- 自动同步到 store（通过 Proxy 拦截）
- 代码更简洁直观

**适用场景**：

- 新项目开发（推荐）
- 需要更简洁代码的场景
- 类似 Composition API / Hooks 的使用习惯

### 3. `mixed-usage.ts` - 混合使用方式

这个示例展示了可以在同一个 Store 中混合使用不同的方式。

**特点**：

- 可以在同一个 Store 中同时使用 `set/get` 和 `this`
- 根据具体场景选择最合适的方式
- 灵活性强

**适用场景**：

- 渐进式迁移
- 不同方法适合不同场景的情况

## 运行示例

```bash
# 类型检查
deno check examples/with-set-get-api.ts
deno check examples/with-this.ts
deno check examples/mixed-usage.ts

# 运行示例（需要实现 fetch API）
deno run --allow-net examples/with-set-get-api.ts
deno run --allow-net examples/with-this.ts
deno run examples/mixed-usage.ts
```

## 类型推断

所有示例都包含完整的 TypeScript 类型定义，确保：

- ✅ 类型安全
- ✅ 完整的类型推断
- ✅ IDE 自动补全
- ✅ 编译时类型检查

## 注意事项

1. **方法定义**：必须使用普通函数（`function`），不能使用箭头函数（`() => {}`），这样才能正确绑定
   `this`
2. **类型定义**：建议为 Store 定义完整的接口类型，以获得更好的类型推断
3. **状态更新**：使用 `this` 方式时，属性修改会自动同步到 store，无需手动调用
   `set()`
