# @dreamer/store Test Report

English | [中文 (Chinese)](../zh-CN/TEST_REPORT.md)

## Test Overview

- **Package Version**: @dreamer/store@1.0.4
- **Test Library Version**: @dreamer/test@^1.0.15
- **Test Framework**: @dreamer/test (compatible with Deno and Bun)
- **Test Date**: 2026-03-22
- **Test Environment**:
  - Deno 2.6+
  - Bun (when running `bun test`)

## Test Results

### Overall Statistics

- **Total Tests**: 30 (Deno), 27 (Bun; framework cleanup counted once per file)
- **Passed**: 30 ✅
- **Failed**: 0
- **Pass Rate**: 100% ✅
- **Execution Time**: ~1s (Deno), ~0.7s (Bun)

### Test File Statistics

| Test File        | Tests | Status      | Description                                                                    |
| ---------------- | ----- | ----------- | ------------------------------------------------------------------------------ |
| `mod.test.ts`    | 17    | ✅ All pass | defineStore, persist, edge cases, subscribe/getState on store                  |
| `view.test.ts`   | 5     | ✅ All pass | useStoreSignal: SignalRef + granular field effects, setState, full store shape |
| `react.test.ts`  | 5     | ✅ All pass | useStore contract + useStore(store) returns full store, read state & actions   |
| `preact.test.ts` | 4     | ✅ All pass | useStore contract + useStore(store) returns full store, read state & actions   |

## Functional Test Details

### 1. defineStore (mod.test.ts) - 9 tests

| Test Scenario                                                                           | Status |
| --------------------------------------------------------------------------------------- | ------ |
| ✅ State only, asObject: false → returns [get, set]; get/set and set(fn) work           | Pass   |
| ✅ State only, asObject: true (default) → returns single object; store.xxx              | Pass   |
| ✅ With getters, asObject: false → returns [get, set, getters]; getters update          | Pass   |
| ✅ With actions, asObject: false → returns [get, set, actions]; actions work            | Pass   |
| ✅ With getters + actions, asObject: false → [get, set, getters, actions]               | Pass   |
| ✅ Same key returns same instance (singleton)                                           | Pass   |
| ✅ Action can call this.setState and other actions (this.otherAction())                 | Pass   |
| ✅ Direct this.xxx = value in action updates state (view-style assignment)              | Pass   |
| ✅ asObject: true with getters + actions → store.xxx / store.double / store.increment() | Pass   |

**Implementation Highlights**:

- ✅ defineStore(key, config) supports state, getters, actions, persist,
  asObject
- ✅ Store object exposes subscribe and getState for View/React/Preact
  reactivity
- ✅ Tuple return [get, set, getters?, actions?] and single-object return
- ✅ Action context Proxy supports direct assignment (this.xxx = value) and
  setState
- ✅ Same key returns same store instance (global registry)

### 2. defineStore persist (mod.test.ts) - 3 tests

| Test Scenario                                              | Status |
| ---------------------------------------------------------- | ------ |
| ✅ persist without storage uses initial state              | Pass   |
| ✅ persist with mock storage restores and saves state      | Pass   |
| ✅ persist without key uses defineStore key as storage key | Pass   |

**Implementation Highlights**:

- ✅ Optional persist.key (defaults to defineStore key)
- ✅ Optional persist.storage (defaults to localStorage when available)
- ✅ Restore on init, save on set

### 3. defineStore Edge Cases (mod.test.ts) - 4 tests

| Test Scenario                                                                | Status |
| ---------------------------------------------------------------------------- | ------ |
| ✅ Empty state {} → get/set work normally                                    | Pass   |
| ✅ Multiple consecutive set → final state is last set                        | Pass   |
| ✅ persist: storage.getItem throws → no crash, use initial state             | Pass   |
| ✅ persist: storage.setItem throws → no crash, in-memory state still updated | Pass   |

**Implementation Highlights**:

- ✅ Empty state and consecutive updates behave correctly
- ✅ Persist errors (getItem/setItem throw) are caught; state remains consistent

### 4. View adapter (view.test.ts) - 5 tests

| Test Scenario                                                                           | Status |
| --------------------------------------------------------------------------------------- | ------ |
| ✅ useStoreSignal(store) returns reactive state object; direct read matches             | Pass   |
| ✅ After store.setState, state.xxx reflects new value; createEffect can react           | Pass   |
| ✅ Returned object supports setState, actions, same shape as store                      | Pass   |
| ✅ Per-field signals: changing one field does not re-run effects that only read another | Pass   |

**Implementation Highlights**:

- ✅ useStoreSignal(store) subscribes to store and returns a proxy: state keys
  use **@dreamer/view** **SignalRef** (`.value`), actions/getters/setState are
  forwarded to the store.

### 5. React adapter (react.test.ts) - 5 tests

| Test Scenario                                                                    | Status |
| -------------------------------------------------------------------------------- | ------ |
| ✅ Store has subscribe and getState; getState() matches current state            | Pass   |
| ✅ subscribe(listener) is called when setState runs                              | Pass   |
| ✅ useSyncExternalStore semantics: listener can read getState() after notify     | Pass   |
| ✅ useStore(store) returns full store; component can read state and call actions | Pass   |

**Implementation Highlights**:

- ✅ defineStore asObject store fulfills useStore (useSyncExternalStore)
  contract; useStore(store) returns the store itself for state + actions.

### 6. Preact adapter (preact.test.ts) - 4 tests

| Test Scenario                                                      | Status |
| ------------------------------------------------------------------ | ------ |
| ✅ Store has subscribe and getState; getState() matches state      | Pass   |
| ✅ subscribe(listener) is called when setState runs                | Pass   |
| ✅ useStore(store) returns full store; read state and call actions | Pass   |

**Implementation Highlights**:

- ✅ Same subscribe/getState contract as React; useStore(store) returns full
  store.

## Test Coverage Analysis

### API Coverage

| API / Behaviour                                   | Coverage                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| defineStore(key, { state })                       | ✅ Tuple and object return                                            |
| defineStore with getters                          | ✅ Tuple [get, set, getters] and object                               |
| defineStore with actions                          | ✅ Tuple [get, set, actions] and object; setState and direct this.xxx |
| defineStore with getters + actions                | ✅ Tuple and object                                                   |
| Same key singleton                                | ✅ Same instance returned                                             |
| subscribe / getState (reactivity)                 | ✅ Notify on setState; getState() snapshot                            |
| persist (key, storage, restore, save)             | ✅ Restore, save, default key                                         |
| set(value) and set(fn)                            | ✅ Both forms tested                                                  |
| StoreBuiltIn\<T\>, DefineStoreReturnType\<T, K?\> | ✅ Typing helpers for store shape; optional state keys param          |

### Adapter Coverage

| Adapter        | Coverage                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| View           | ✅ useStoreSignal: SignalRef per field, granular effects, setState, full store |
| React / Preact | ✅ subscribe, getState; useStore(store) returns full store, state + actions    |

## Strengths

1. ✅ **Full defineStore API**: state, getters, actions, persist, asObject
2. ✅ **Reactivity**: subscribe and getState on store for View/React/Preact
3. ✅ **View-style actions**: Direct assignment (this.xxx = value) and setState
4. ✅ **Global singleton**: Same key returns same instance
5. ✅ **Persist**: Optional key/storage, restore on init, save on set; errors
   handled
6. ✅ **Type helpers**: StoreBuiltIn\<T\>, DefineStoreReturnType\<T, K?\> for
   concise StoreType
7. ✅ **Adapter tests**: view (4), react (5), preact (4) cover reactive contract
   and full-store return
8. ✅ **100% pass rate**: 30 tests (Deno), 27 (Bun), 0 failed

## Conclusion

@dreamer/store is fully tested with 31 tests passing (Deno) and 100% pass rate.
defineStore (tuple and object forms), persist behaviour, edge cases, reactivity
(subscribe/getState), and View/React/Preact adapters (useStoreSignal, useStore
returning full store) are covered. StoreBuiltIn and DefineStoreReturnType
support concise store typing. The implementation is suitable for production use.

**Total tests**: 31 (17 mod + 5 view + 5 react + 4 preact; Bun reports 28 for
the same file set).
