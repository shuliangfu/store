# @dreamer/store

> A client-side state management library with the same API style as
> @dreamer/view store: global keyed stores, getters, actions, and optional
> persist.

[![JSR](https://jsr.io/badges/@dreamer/store)](https://jsr.io/@dreamer/store)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-18%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

📖 **Docs**: English | [中文 (Chinese)](./docs/zh-CN/README.md)

---

## 🎯 Features

- **defineStore(key, config)** — Create a store by key; same key returns the
  same instance (global singleton).
- **state / getters / actions** — `config.state` (required), optional `getters`
  (derived via `this`), optional `actions` (direct `this.xxx = value` or
  `this.setState`, and `this.otherAction()`).
- **persist** — Optional restore from storage on init and save on update;
  default key is the store key; default storage is `localStorage` when
  available.
- **Return shape** — `asObject: true` (default): single object (e.g.
  `store.count`, `store.increment()`). `asObject: false`: tuple
  `[get, set, getters?, actions?]`.
- **Auto-cleanup** — When the runtime supports WeakRef/FinalizationRegistry and
  no references to the store remain, the key is removed from the global
  registry; only the in-memory registry is cleared, **persist** storage is not
  affected.

---

## 📦 Installation

```bash
# Deno
deno add jsr:@dreamer/store

# Bun
bunx jsr add @dreamer/store
```

---

## 🌍 Environment compatibility

| Environment | Support                                                    |
| ----------- | ---------------------------------------------------------- |
| Deno 2.6+   | ✅                                                         |
| Bun         | ✅                                                         |
| Server      | ❌ (client-only; persist uses localStorage when available) |
| Browser     | ✅                                                         |

---

## ✨ Features (detailed)

- **Store**
  - `defineStore(key, config)` — state (required), getters, actions, persist,
    asObject
  - Same key → same instance; state persists across SPA page navigation
  - In actions: direct assignment (`this.xxx = value`) or `this.setState(...)`;
    call other actions via `this.otherAction()`
- **Persist**
  - Optional `persist.key` (default: store key), `persist.storage` (default:
    localStorage), `serialize` / `deserialize`
  - Restore on init; save on every set
- **TypeScript**
  - Full types for state, getters, actions, and return shapes

---

## 🎯 Use cases

- Global client state (e.g. user, theme, UI flags)
- SPA state that survives route changes (same store instance)
- Optional persistence to localStorage (e.g. preferences)

---

## 🚀 Quick start

### Single object (default, `asObject: true`)

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

// Read state and getters
console.log(store.count, store.double);
store.increment(2);
store.setName("hello");
```

### Tuple (`asObject: false`): `[get, set, getters?, actions?]`

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

### Persist (e.g. localStorage)

```typescript
const store = defineStore("theme", {
  state: { theme: "light" as "light" | "dark" },
  actions: {
    setTheme(theme: "light" | "dark") {
      this.theme = theme;
    },
  },
  persist: { key: "my-theme" }, // optional: storage, serialize, deserialize
});
```

### Actions: direct assignment and calling other actions

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

| Parameter         | Type                                                                | Description                                                                                                                    |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `key`             | `string`                                                            | Unique key; same key returns the same store instance. Used as default persist key when `persist.key` is omitted.               |
| `config.state`    | `T` (record)                                                        | Initial state (required). Shallow-copied.                                                                                      |
| `config.getters`  | `Record<string, (this: T) => unknown>`                              | Optional. Each getter reads `this` (current state).                                                                            |
| `config.actions`  | `Record<string, (this: Ctx, ...args) => any>`                       | Optional. In actions, `this` has state, `setState`, and other actions; you can use `this.xxx = value` or `this.setState(...)`. |
| `config.persist`  | `{ key?: string, storage?: StorageLike, serialize?, deserialize? }` | Optional. Restore on init; save on set.                                                                                        |
| `config.asObject` | `boolean`                                                           | Default `true`. `true` → single object; `false` → tuple `[get, set, getters?, actions?]`.                                      |

**Returns**: Single object (when `asObject: true`) or tuple
`[get, set, getters?, actions?]` (when `asObject: false`).

### Auto-cleanup

When the runtime supports WeakRef and FinalizationRegistry, the registry holds
weak references to stores; when no references to the return value of
`defineStore` remain, GC reclaims the object and a callback removes the key from
the registry. **Only the in-memory registry is cleared**; data in persist
storage (e.g. localStorage) is not deleted. A later `defineStore(key, config)`
creates a new instance and restores from persist. There is no separate
“unregister store” API; manual cleanup is usually unnecessary.

### Types (exported)

- `StorageLike` — `getItem(key)`, `setItem(key, value)`, optional
  `removeItem(key)`.
- `CreateStorePersistOptions<T>` — `key?`, `storage?`, `serialize?`,
  `deserialize?`.
- `CreateStoreConfig<T, G, A>` — Config shape for `defineStore`.
- `StoreActionContextBase<T>`, `StoreActionContext<T, A>`, `StoreGetters<T>`,
  `StoreActions<T, A>` — For typing getters/actions.

---

## 📋 Changelog

### [1.0.0] - 2026-02-19

- **Added**: Initial stable release. defineStore (state, getters, actions,
  persist, asObject), auto-cleanup via WeakRef/FinalizationRegistry, full
  TypeScript types.
- **Changed**: No separate unregister API; persist storage is not cleared by
  auto-cleanup.

Full history: [docs/en-US/CHANGELOG.md](./docs/en-US/CHANGELOG.md)

---

## 📊 Test report

- **Date**: 2026-02-19
- **Total**: 18 tests, 18 passed, 100%
- **Details**: [docs/en-US/TEST_REPORT.md](./docs/en-US/TEST_REPORT.md)

---

## 📝 Notes

- Client-only: intended for browser/SPA; persist uses `localStorage` when
  available.
- Global registry: same `key` returns the same instance; state is kept across
  SPA page navigation until no references remain (then the key may be
  auto-removed from the registry where supported) or page reload. Auto-cleanup
  does not delete persist data.
- API is aligned with @dreamer/view store (direct assignment in actions,
  getters/actions/persist shape).

---

## 🤝 Contributing

Issues and Pull Requests are welcome.

---

## 📄 License

Apache-2.0 — see [LICENSE](./LICENSE).

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
