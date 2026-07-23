# Changelog

All notable changes to @dreamer/store are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-07-23

### Added

- **Node.js 22+ compatibility**: Full support for Node.js 22+ alongside Deno and
  Bun. `@dreamer/view` upgraded to ^2.2.0 (Node-compatible), `@dreamer/test` to
  ^1.2.3.
- **Node.js test infrastructure**: `test-node.mjs` runner (main-process execution,
  no fork/IPC), `tsconfig.json` (Bundler module resolution), `test:node` script
  in deno.json and package.json.
- **9-job CI matrix**: 3 Deno v2.9 + 3 Bun + 3 Node 22 (Linux/macOS/Windows).
  No Chromium, no external services — all 4 test files are pure unit tests.
- `engines.node: ">=22"` and `engines.bun: ">=1.3"` in package.json.
- `nodeModulesDir: "auto"` and `minimumDependencyAge: "0"` in deno.json for JSR
  dependency resolution.
- `react-dom` dependency added (required by `@dreamer/view` React server-side
  rendering types).

### Changed

- **View adapter API migration**: `@dreamer/view@2.x` moved `createSignal`/
  `createEffect`/`Signal` to the `@dreamer/view/reactivity` subpath and removed
  the legacy `@dreamer/view/signal` and `@dreamer/view/effect` subpaths.
  `src/view.ts` updated to import from `@dreamer/view/reactivity`; `SignalRef`
  type renamed to `Signal`.
- `deno.json` and `package.json` dependency versions synchronized (both use `^`
  ranges).

### Notes

- **src is runtime-agnostic**: zero `Deno.*` API calls, zero `IS_NODE` checks —
  pure logic + cross-runtime Web API. No source code changes were needed for
  Node.js support beyond the View v2 API migration.

---

## [1.0.4] - 2026-03-22

### Fixed

- **View adapter (`@dreamer/store/view`)**: `useStoreSignal` now uses
  **`SignalRef`** from **`@dreamer/view`** (`createSignal` returns `.value`
  read/write), fixing runtime
  **`createSignal is not a function or its return value is not iterable`** when
  used with **@dreamer/view@1.3+** (tuple destructuring removed in View).

### Changed

- **Dependencies**: **@dreamer/view** **^1.3.4** (in `deno.json` /
  `package.json`).

---

## [1.0.3] - 2026-03-14

### Changed

- **View adapter**: `useStoreSignal` now uses one signal per state field; only
  effects that read a given field re-run when that field changes (e.g. changing
  `contracts` no longer triggers effects that only read `web3`).

---

## [1.0.2] - 2026-03-14

### Added

- **Type helpers**: `StoreBuiltIn<T>` and `DefineStoreReturnType<T, K?>` for
  concise store typing; optional second generic = state keys (omit to infer
  non-function keys).
- Test report and docs update: 30 tests (Deno), 27 (Bun); View/React/Preact
  adapter tests and full-store return behaviour documented.

---

## [1.0.1] - 2026-03-13

### Added

- **Reactivity**: `subscribe(listener)` and `getState()` on store object (when
  `asObject: true`) for framework integration.
- **Framework adapters**: `@dreamer/store/view` (useStoreSignal),
  `@dreamer/store/react` (useStore), `@dreamer/store/preact` (useStore).
- New tests for view, react, and preact adapters.

### Changed

- **View adapter**: `useStoreSignal(store)` now returns a reactive state object
  instead of a tick getter. In `createEffect`, read `state.count` (or any
  `state.xxx`) to react to store updates; no need to call a getter first.

---

## [1.0.0] - 2026-02-19

### Added

Initial stable release. Client-side state management with the same API style as
@dreamer/view store.

#### Core API

- **defineStore(key, config)**
  - Defines a store by unique `key`; same key returns the same instance
    (singleton per key). Suitable for code-split bundles that share state by
    key.
  - **state** (required): Initial state object; stored state is shallow-copied.
  - **getters** (optional): Derived read-only values; each getter is a function
    with `this` bound to current state; returns are exposed as getter values.
  - **actions** (optional): Methods that can read/write state; `this` is a
    context with current state, `setState`, and other actions (so actions can
    call each other). Supports direct assignment (`this.xxx = value`) and
    `this.setState(value | updater)` for merging, aligned with @dreamer/view
    store.
  - **persist** (optional): Restore state from storage on init and write state
    to storage on each `setState`. Options: `key` (storage key, defaults to
    store key), `storage` (StorageLike, defaults to `globalThis.localStorage`
    when available), `serialize` / `deserialize` (default JSON).
  - **asObject** (optional, default `true`): When `true`, returns a single
    object (state + `setState` + getters + actions); when `false`, returns a
    tuple `[get, set, getters?, actions?]`.
  - Return type: tuple or one of `StoreAsObjectStateOnly`,
    `StoreAsObjectWithGetters`, `StoreAsObject`,
    `StoreAsObjectWithGettersAndActions` depending on config.
  - No separate “unregister store” API; when the runtime supports
    WeakRef/FinalizationRegistry, the store is auto-cleaned from the registry
    after the user drops all references.

#### Types and interfaces

- **StorageLike**: Interface for persist storage (`getItem`, `setItem`, optional
  `removeItem`).
- **CreateStorePersistOptions<T>**: `key`, `storage`, `serialize`, `deserialize`
  for persist.
- **CreateStoreConfig<T, G, A>**: `state`, `getters`, `actions`, `persist`,
  `asObject` for defineStore.
- **StoreGetters<T>**, **StoreActionContextBase<T>**, **StoreActionContext<T,
  A>**, **StoreActions<T, A>**: Types for getters and actions and their `this`
  context.
- **StoreAsObjectStateOnly<T>**, **StoreAsObjectWithGetters<T, G>**,
  **StoreAsObject<T, A>**, **StoreAsObjectWithGettersAndActions<T, G, A>**:
  Return shape types when `asObject: true`.

#### Behavior and environment

- **Global registry**: Store instances are keyed by string in a global registry
  (Symbol.for), so multiple modules using the same key share one store.
- **Auto-cleanup**: When the runtime supports WeakRef and FinalizationRegistry,
  the registry holds weak references to stores; when the user no longer holds
  the return value of defineStore, GC triggers a callback that removes the key
  from the registry. Auto-cleanup **only clears the in-memory registry**; it
  does not delete data in persist storage (e.g. localStorage). A later
  defineStore(key, config) creates a new instance and restores from persist as
  usual. When unsupported, the registry holds strong references.
- **Client-only**: Library is intended for client (browser) state; no
  server-side guarantees.
- **Persist**: When `persist` is set and no custom `storage` is given, uses
  `globalThis.localStorage` if present; otherwise persist is skipped.
  Serialization defaults to JSON; custom `serialize`/`deserialize` supported.
- **Compatibility**: Deno 2.6+, Bun 1.3.5+, and browsers (localStorage used for
  persist when available).

### Compatibility

- Deno 2.6+
- Bun 1.3.5+
- Browsers (localStorage for persist when available)
