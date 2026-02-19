# @dreamer/store Test Report

English | [中文 (Chinese)](../zh-CN/TEST_REPORT.md) 03

## Test Overview

- **Package Version**: @dreamer/store@1.0.0-beta.3
- **Test Library Version**: @dreamer/test@^1.0.9
- **Test Framework**: @dreamer/test (compatible with Deno and Bun)
- **Test Date**: 2026-02-19
- **Test Environment**:
  - Deno 2.6+
  - Bun (when running `bun test`)

## Test Results

### Overall Statistics

- **Total Tests**: 18
- **Passed**: 18 ✅
- **Failed**: 0
- **Pass Rate**: 100% ✅
- **Execution Time**: ~6ms (Deno environment)

### Test File Statistics

| Test File     | Tests | Status      | Description                                          |
| ------------- | ----- | ----------- | ---------------------------------------------------- |
| `mod.test.ts` | 17    | ✅ All pass | defineStore / unregisterStore / persist / edge cases |
| @dreamer/test | 1     | ✅ All pass | Cleanup (e.g. browser teardown)                      |

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
- ✅ Tuple return [get, set, getters?, actions?] and single-object return
- ✅ Action context Proxy supports direct assignment (this.xxx = value) and
  setState
- ✅ Same key returns same store instance (global registry)

### 2. unregisterStore (mod.test.ts) - 1 test

| Test Scenario                                                               | Status |
| --------------------------------------------------------------------------- | ------ |
| ✅ After unregister, same key creates new instance with fresh initial state | Pass   |

**Implementation Highlights**:

- ✅ unregisterStore(key) removes store from global registry
- ✅ Next defineStore(key, ...) creates a new instance

### 3. defineStore persist (mod.test.ts) - 3 tests

| Test Scenario                                              | Status |
| ---------------------------------------------------------- | ------ |
| ✅ persist without storage uses initial state              | Pass   |
| ✅ persist with mock storage restores and saves state      | Pass   |
| ✅ persist without key uses defineStore key as storage key | Pass   |

**Implementation Highlights**:

- ✅ Optional persist.key (defaults to defineStore key)
- ✅ Optional persist.storage (defaults to localStorage when available)
- ✅ Restore on init, save on set

### 4. defineStore Edge Cases (mod.test.ts) - 4 tests

| Test Scenario                                                                | Status |
| ---------------------------------------------------------------------------- | ------ |
| ✅ Empty state {} → get/set work normally                                    | Pass   |
| ✅ Multiple consecutive set → final state is last set                        | Pass   |
| ✅ persist: storage.getItem throws → no crash, use initial state             | Pass   |
| ✅ persist: storage.setItem throws → no crash, in-memory state still updated | Pass   |

**Implementation Highlights**:

- ✅ Empty state and consecutive updates behave correctly
- ✅ Persist errors (getItem/setItem throw) are caught; state remains consistent

## Test Coverage Analysis

### API Coverage

| API / Behaviour                       | Coverage                                                              |
| ------------------------------------- | --------------------------------------------------------------------- |
| defineStore(key, { state })           | ✅ Tuple and object return                                            |
| defineStore with getters              | ✅ Tuple [get, set, getters] and object                               |
| defineStore with actions              | ✅ Tuple [get, set, actions] and object; setState and direct this.xxx |
| defineStore with getters + actions    | ✅ Tuple and object                                                   |
| Same key singleton                    | ✅ Same instance returned                                             |
| unregisterStore(key)                  | ✅ New instance after unregister                                      |
| persist (key, storage, restore, save) | ✅ Restore, save, default key                                         |
| set(value) and set(fn)                | ✅ Both forms tested                                                  |

### Edge Case Coverage

| Edge Case              | Status                        |
| ---------------------- | ----------------------------- |
| Empty state {}         | ✅ Pass                       |
| Consecutive set        | ✅ Pass                       |
| storage.getItem throws | ✅ Pass (use initial state)   |
| storage.setItem throws | ✅ Pass (state still updated) |
| persist key default    | ✅ Pass (use defineStore key) |

### Error Handling Coverage

| Scenario              | Status                             |
| --------------------- | ---------------------------------- |
| Persist getItem error | ✅ Caught; initial state used      |
| Persist setItem error | ✅ Caught; in-memory state updated |

## Strengths

1. ✅ **Full defineStore API**: state, getters, actions, persist, asObject
2. ✅ **View-style actions**: Direct assignment (this.xxx = value) and setState
3. ✅ **Global singleton**: Same key returns same instance; unregisterStore for
   cleanup
4. ✅ **Persist**: Optional key/storage, restore on init, save on set; errors
   handled
5. ✅ **Edge tests**: Empty state, consecutive set, storage errors
6. ✅ **100% pass rate**: 18 tests, 0 failed

## Conclusion

@dreamer/store is fully tested with 18 tests passing and 100% pass rate.
defineStore (tuple and object forms), unregisterStore, persist behaviour, and
edge cases (empty state, consecutive set, storage errors) are covered. The
implementation matches the view store style (direct assignment in actions) and
is suitable for production use.

**Total tests**: 18 (17 in mod.test.ts + 1 framework cleanup)
