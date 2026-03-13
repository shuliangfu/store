# Changelog

All notable changes to @dreamer/store are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
