# @dreamer/store

> A client-side state management library with the same API style as
> @dreamer/view store: global keyed stores, getters, actions, and optional
> persist.

[![JSR](https://jsr.io/badges/@dreamer/store)](https://jsr.io/@dreamer/store)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-30%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

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
- **Reactivity** — When `asObject: true`, the store object has
  `subscribe(listener)` and `getState()` so View / React / Preact can re-render
  or re-run effects when state changes. Use the framework adapters:
  `@dreamer/store/view`, `@dreamer/store/react`, `@dreamer/store/preact`.
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

**Framework adapters** (optional): use the subpath that matches your UI
framework so the store triggers re-renders or effects.

- View: `jsr:@dreamer/store/view` → `useStoreSignal`
- React: `jsr:@dreamer/store/react` → `useStore` (requires React 18+)
- Preact: `jsr:@dreamer/store/preact` → `useStore` (requires Preact with compat)

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
  - **StoreBuiltIn\<T\>**: built-in setState, subscribe, getState (for StoreType
    intersection)
  - **DefineStoreReturnType\<T, K?\>**: one-object store type; T = state +
    getters + actions, optional K = state keys (omit to infer non-function keys)
- **Framework adapters**
  - **View**: `useStoreSignal(store)` — returns a reactive state object; read
    `state.xxx` in `createEffect` to react.
  - **React**: `useStore(store)` — hook that re-renders when store state changes
    (`useSyncExternalStore`).
  - **Preact**: `useStore(store)` — same as React, from `preact/compat`.

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

## 🔌 Framework adapters (React / Preact / View)

The store returned by `defineStore` (when `asObject: true`) has
**`subscribe(listener)`** and **`getState()`**. Use the following entry points
so your UI framework re-renders or re-runs effects when the store changes.

### View — `@dreamer/store/view`

**useStoreSignal(store)** returns a reactive state object. Read `state.count`,
`state.name`, etc. inside `createEffect`; the effect re-runs when the store
updates.

```typescript
import { defineStore } from "jsr:@dreamer/store";
import { useStoreSignal } from "jsr:@dreamer/store/view";
import { createEffect } from "@dreamer/view/effect";

const store = defineStore("counter", {
  state: { count: 0 },
  actions: {
    increment() {
      this.count++;
    },
  },
});

const state = useStoreSignal(store);

createEffect(() => {
  console.log(state.count); // 直接读 state.count，自动监听
});
```

| Export                  | Description                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `useStoreSignal(store)` | Subscribes to `store`; returns a reactive state object. Read `state.xxx` in `createEffect` to react to store updates. |

### React — `@dreamer/store/react`

**useStore(store)** returns the current state and re-renders the component when
the store changes (uses `useSyncExternalStore`). Requires React 18+.

```typescript
import { defineStore } from "jsr:@dreamer/store";
import { useStore } from "jsr:@dreamer/store/react";

const store = defineStore("counter", {
  state: { count: 0 },
  actions: {
    increment() {
      this.count++;
    },
  },
});

function Counter() {
  const state = useStore(store);
  return (
    <div>
      <span>{state.count}</span>
      <button type="button" onClick={() => store.increment()}>+1</button>
    </div>
  );
}
```

| Export            | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `useStore(store)` | Hook that returns `store.getState()` and re-renders when the store notifies. |

### Preact — `@dreamer/store/preact`

**useStore(store)** — same API as React adapter; uses `preact/compat`’s
`useSyncExternalStore`. No need to install React.

```typescript
import { defineStore } from "jsr:@dreamer/store";
import { useStore } from "jsr:@dreamer/store/preact";

const store = defineStore("counter", {
  state: { count: 0 },
  actions: {
    increment() {
      this.count++;
    },
  },
});

function Counter() {
  const state = useStore(store);
  return (
    <div>
      <span>{state.count}</span>
      <button type="button" onClick={() => store.increment()}>+1</button>
    </div>
  );
}
```

| Export            | Description                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `useStore(store)` | Same as React: returns current state and re-renders on store change (Preact only). |

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

### Store object (when `asObject: true`): subscribe and getState

- **`store.subscribe(listener: () => void): () => void`** — Subscribe to state
  changes. Called after each `setState` or direct assignment in actions. Returns
  an unsubscribe function.
- **`store.getState(): T`** — Returns the current state snapshot (same reference
  until the next update). Used by `useStore` (React/Preact) and for custom
  subscriptions.

### Types (exported)

- `StorageLike` — `getItem(key)`, `setItem(key, value)`, optional
  `removeItem(key)`.
- `StoreSubscribe` — Type of `subscribe`:
  `(listener: () => void) => () => void`.
- `CreateStorePersistOptions<T>` — `key?`, `storage?`, `serialize?`,
  `deserialize?`.
- `CreateStoreConfig<T, G, A>` — Config shape for `defineStore`.
- `StoreActionContextBase<T>`, `StoreActionContext<T, A>`, `StoreGetters<T>`,
  `StoreActions<T, A>` — For typing getters/actions.
- `StoreBuiltIn<T>` — setState, subscribe, getState (intersect with your
  StoreType when needed).
- `DefineStoreReturnType<T, K?>` — Concise store type:
  `DefineStoreReturnType<{ count: number; double: number; increment: () => void }>`;
  optional second generic = state keys.

---

## 📋 Changelog

### [1.0.2] - 2026-03-14

- **Added**: Type helpers `StoreBuiltIn<T>`, `DefineStoreReturnType<T, K?>`;
  test report and docs updated (30 tests Deno, 27 Bun).

Full history: [docs/en-US/CHANGELOG.md](./docs/en-US/CHANGELOG.md)

---

## 📊 Test report

- **Date**: 2026-03-11
- **Total**: 30 tests (Deno), 27 (Bun), all passed, 100%
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
- Reactivity: use `store.subscribe` and `store.getState` with the
  View/React/Preact adapters so components or effects update when the store
  changes.

---

## 🤝 Contributing

Issues and Pull Requests are welcome.

---

## 📄 License

Apache-2.0 — see [LICENSE](./LICENSE).

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
