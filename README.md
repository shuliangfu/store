# @dreamer/store

一个用于 Deno 的客户端状态管理库，专为 Preact 和 React 设计，提供响应式状态管理功能。

## 功能

客户端状态管理库，用于管理客户端应用的状态，支持 Preact 和 React。

## 特性

- **响应式状态**：
  - 基于 Signals 的响应式状态管理
  - 自动依赖追踪
  - 细粒度更新（只更新依赖的组件）
  - 高性能（避免不必要的重渲染）
- **状态管理方式**：
  - **Store（推荐）**：类似 Redux/Zustand 的集中式状态管理
  - **Signals**：类似 Preact Signals 的细粒度响应式状态
  - **Context**：基于 Context API 的状态共享
- **Store 特性**：
  - 创建 Store（类似 Zustand）
  - Actions（同步和异步）
  - Selectors（选择器，避免不必要的更新）
  - 中间件支持（日志、持久化、时间旅行等）
  - 状态订阅和更新
  - 类型安全（完整的 TypeScript 支持）
- **Signals 特性**：
  - 创建 Signal（响应式值）
  - Computed（计算属性）
  - Effect（副作用）
  - 批量更新
- **持久化**：
  - 状态持久化到 localStorage（默认）
  - 状态持久化到 sessionStorage（可选）
  - 自定义持久化适配器
  - 状态恢复和同步
- **开发工具**：
  - 状态调试工具
  - 时间旅行调试
  - 状态快照
  - 性能监控

## 使用场景

- 客户端应用状态管理（Preact/React）
- 全局状态管理
- 组件间状态共享
- 表单状态管理
- UI 状态管理（主题、侧边栏等）

## 优先级

⭐⭐⭐⭐

## 安装

```bash
deno add jsr:@dreamer/store
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：❌ 不支持（纯客户端状态管理库，持久化使用 localStorage/sessionStorage，不需要服务端支持）
- **客户端**：✅ 支持（浏览器环境，完整的客户端状态管理功能）
- **依赖**：无外部依赖（纯 TypeScript 实现，兼容 Preact 和 React）

## 示例用法

### Store 方式（推荐）

```typescript
import { defineStore } from "jsr:@dreamer/store";

// 定义 Store 类型
interface UserStore {
  user: { id: number; name: string; email: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<UserStore["user"]>) => void;
}

// 创建 Store
// 方式1：使用 set/get（传统方式）
const useUserStore1 = defineStore<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async function (email: string, password: string) {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const user = await response.json();
    set({ user, isAuthenticated: true });
    // 可以使用 this 调用其他方法
    this.updateUser({ lastLogin: new Date() });
  },

  logout: function () {
    set({ user: null, isAuthenticated: false });
  },

  updateUser: function (updates) {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));

// 方式2：直接使用 this（推荐，更简洁）
// 注意：虽然需要传入 set 和 get 参数，但在方法中可以直接使用 this.property = value
const useUserStore = defineStore<UserStore>((set, get, api) => ({
  user: null,
  isAuthenticated: false,

  // 异步 Action - 直接使用 this 修改属性（无需调用 set）
  login: async function (email: string, password: string) {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // ✅ 直接使用 this 赋值，自动同步到 store（通过 Proxy 拦截）
    this.user = await response.json();
    this.isAuthenticated = true;
    // ✅ 可以使用 this 调用其他方法（推荐）
    this.updateUser({ lastLogin: new Date() });
    // ✅ 也可以使用 api 调用其他方法（可选）
    // api?.updateUser({ lastLogin: new Date() });
  },

  // 同步 Action - 直接使用 this 修改属性
  logout: function () {
    this.user = null;
    this.isAuthenticated = false;
  },

  // 更新部分状态 - 直接使用 this 访问和修改
  updateUser: function (updates) {
    if (this.user) {
      this.user = { ...this.user, ...updates };
    }
  },
}));

// 在组件中使用
function UserProfile() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const login = useUserStore((state) => state.login);
  const logout = useUserStore((state) => state.logout);

  if (!isAuthenticated) {
    return <button onClick={() => login("user@example.com", "password")}>登录</button>;
  }

  return (
    <div>
      <p>欢迎，{user?.name}</p>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

### Signals 方式（细粒度更新）

```typescript
import { signal, computed, effect } from "jsr:@dreamer/store";

// 创建 Signal
const count = signal(0);
const name = signal("Alice");

// 计算属性
const doubleCount = computed(() => count.value * 2);
const greeting = computed(() => `Hello, ${name.value}!`);

// 副作用
effect(() => {
  console.log(`Count is now: ${count.value}`);
});

// 更新值
count.value = 10; // 自动触发依赖更新
name.value = "Bob"; // 自动触发依赖更新

// 在组件中使用
function Counter() {
  // 组件会自动订阅 signal，当值变化时自动更新
  return (
    <div>
      <p>Count: {count.value}</p>
      <p>Double: {doubleCount.value}</p>
      <p>{greeting.value}</p>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>-</button>
    </div>
  );
}
```

### 状态持久化

```typescript
import { createStore, persist } from "jsr:@dreamer/store";

interface SettingsStore {
  theme: "light" | "dark";
  language: "zh" | "en";
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: "zh" | "en") => void;
}

// 创建带持久化的 Store（默认使用 localStorage）
const useSettingsStore = defineStore<SettingsStore>(
  persist(
    (set) => ({
      theme: "light",
      language: "zh",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "settings", // 存储键名
      // storage 默认为 "localStorage"，可以不指定
      // storage: "localStorage", // 默认值，持久化到 localStorage（浏览器关闭后仍保留）
    }
  )
);

// 使用 sessionStorage（会话级持久化，浏览器关闭后清除）
const useSessionStore = defineStore<SettingsStore>(
  persist(
    (set) => ({
      theme: "light",
      language: "zh",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "session-settings",
      storage: "sessionStorage", // 使用 sessionStorage（会话级存储）
    }
  )
);

// 状态会自动持久化到指定的存储
// 页面刷新后会自动恢复状态
```

**存储方式说明**：
- **localStorage（默认）**：持久化存储，浏览器关闭后数据仍保留，适合用户偏好设置、主题等
- **sessionStorage**：会话级存储，浏览器关闭后数据清除，适合临时状态、表单数据等

### 中间件

```typescript
import { createStore, logger, devtools } from "jsr:@dreamer/store";

const useStore = defineStore(
  logger( // 日志中间件
    devtools( // 开发工具中间件
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: "MyStore" }
    )
  )
);
```

### Selectors（选择器）

```typescript
// 使用 Selector 避免不必要的更新
function UserName() {
  // 只订阅 user.name，当其他字段变化时不会更新
  const userName = useUserStore((state) => state.user?.name);
  return <p>{userName}</p>;
}

// 使用多个 Selector
function UserInfo() {
  const { name, email } = useUserStore((state) => ({
    name: state.user?.name,
    email: state.user?.email,
  }));
  return (
    <div>
      <p>Name: {name}</p>
      <p>Email: {email}</p>
    </div>
  );
}
```

### 完整示例

```typescript
import { createStore, persist } from "jsr:@dreamer/store";

// 定义 Store
interface AppStore {
  // 状态
  count: number;
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: "all" | "active" | "completed";

  // Actions
  increment: () => void;
  decrement: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  setFilter: (filter: "all" | "active" | "completed") => void;

  // Selectors（计算属性）
  filteredTodos: () => Array<{ id: number; text: string; completed: boolean }>;
}

// 创建 Store
const useAppStore = defineStore<AppStore>((set, get) => ({
  count: 0,
  todos: [],
  filter: "all",

  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),

  addTodo: (text: string) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, completed: false }],
  })),

  toggleTodo: (id: number) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  })),

  setFilter: (filter) => set({ filter }),

  filteredTodos: () => {
    const { todos, filter } = get();
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  },
}));

// 在组件中使用
function TodoApp() {
  const count = useAppStore((state) => state.count);
  const todos = useAppStore((state) => state.filteredTodos());
  const filter = useAppStore((state) => state.filter);
  const increment = useAppStore((state) => state.increment);
  const addTodo = useAppStore((state) => state.addTodo);
  const setFilter = useAppStore((state) => state.setFilter);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>

      <div>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("active")}>Active</button>
        <button onClick={() => setFilter("completed")}>Completed</button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 与 Preact Signals 的关系

- **兼容性**：`@dreamer/store` 的 Signals 方式与 Preact Signals 兼容
- **增强功能**：提供 Store 方式，类似 Zustand，更适合复杂状态管理
- **推荐使用**：
  - **简单状态**：使用 Signals 方式（轻量级、高性能）
  - **复杂状态**：使用 Store 方式（集中管理、更好的组织）

## 备注

- 专为客户端状态管理设计，纯客户端库
- 支持 Preact 和 React，API 保持一致
- 推荐在 `_app.tsx` 中初始化全局 Store
- 状态持久化使用 localStorage/sessionStorage，适合客户端场景
