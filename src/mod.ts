/**
 * @module @dreamer/store
 *
 * 客户端状态管理库，采用与 view store 相同的调用方式。
 *
 * API：
 * - defineStore(key, config) — state / getters / actions / persist，返回 [get, set, getters?, actions?] 或单对象
 * （store 无引用后由 WeakRef/FinalizationRegistry 自动从注册表清理，无单独导出 API）
 *
 * 环境兼容性：
 * - 服务端：❌ 不支持（纯客户端状态管理库）
 * - 客户端：✅ 支持（浏览器环境）
 */

/** 全局 store 注册表 key，用于 code-split 下同一 key 取到同一实例 */
const KEY_STORE_REGISTRY = Symbol.for("dreamer.store.registry");
/** 支持自动回收时，注册表存 { ref: WeakRef(store) }，GC 后由 FinalizationRegistry 回调删除 key */
const KEY_FINALIZATION_REGISTRY = Symbol.for("dreamer.store.finalization");

type RegistryMap = Map<string, unknown | { ref: WeakRef<object> }>;

function getStoreRegistry(): RegistryMap {
  const g = globalThis as unknown as Record<symbol, RegistryMap>;
  if (!g[KEY_STORE_REGISTRY]) {
    g[KEY_STORE_REGISTRY] = new Map();
  }
  return g[KEY_STORE_REGISTRY];
}

function getFinalizationRegistry(): FinalizationRegistry<string> | null {
  if (typeof FinalizationRegistry === "undefined") return null;
  const g = globalThis as unknown as Record<
    symbol,
    FinalizationRegistry<string>
  >;
  if (!g[KEY_FINALIZATION_REGISTRY]) {
    g[KEY_FINALIZATION_REGISTRY] = new FinalizationRegistry<string>((key) => {
      getStoreRegistry().delete(key);
    });
  }
  return g[KEY_FINALIZATION_REGISTRY];
}

/** 从全局注册表取 store；同一 key 返回同一实例。若使用 WeakRef 且已被 GC 则返回 undefined。 */
function getGlobalStore(key: string): unknown {
  const map = getStoreRegistry();
  const entry = map.get(key);
  if (entry == null) return undefined;
  const withRef = entry as { ref?: WeakRef<object> };
  if (typeof withRef.ref?.deref === "function") {
    const v = withRef.ref.deref();
    if (v === undefined) {
      map.delete(key);
      return undefined;
    }
    return v;
  }
  return entry as unknown;
}

/** 将 store 注册到全局；若环境支持 WeakRef/FinalizationRegistry 则弱引用 + 自动回收，否则强引用。 */
function setGlobalStore(key: string, store: unknown): void {
  const map = getStoreRegistry();
  if (
    typeof WeakRef !== "undefined" &&
    getFinalizationRegistry() &&
    typeof store === "object" &&
    store !== null
  ) {
    const ref = new WeakRef(store as object);
    map.set(key, { ref });
    getFinalizationRegistry()!.register(store as object, key);
  } else {
    map.set(key, store);
  }
}

/** defineStore 用持久化存储接口 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/** defineStore 用持久化配置 */
export interface CreateStorePersistOptions<T extends Record<string, unknown>> {
  /** 存储键名（不传时使用 defineStore 的 key） */
  key?: string;
  /** 存储实现；不传时使用 globalThis.localStorage（若存在） */
  storage?: StorageLike | null;
  serialize?: (state: T) => string;
  deserialize?: (raw: string) => T;
}

/** getters：通过 this 读 state，返回派生值 */
export type StoreGetters<T extends Record<string, unknown>> = Record<
  string,
  (this: T) => unknown
>;

/** action 内 this 基类型：state + setState */
export type StoreActionContextBase<T extends Record<string, unknown>> = T & {
  setState: (value: T | ((prev: T) => T)) => void;
};

/** action 内 this 完整类型：state + setState + 其它 actions（可 this.otherAction()） */
export type StoreActionContext<
  T extends Record<string, unknown>,
  A extends Record<string, (...args: unknown[]) => unknown>,
> = StoreActionContextBase<T> & A;

/** actions：通过 this 读写 state（直接 this.xxx = value 或 setState）、调用其它 action */
export type StoreActions<
  T extends Record<string, unknown>,
  A extends Record<string, (...args: unknown[]) => unknown> = Record<
    string,
    (...args: unknown[]) => unknown
  >,
> = {
  [K in keyof A]: (
    this: StoreActionContext<T, A>,
    // deno-lint-ignore no-explicit-any
    ...args: any[]
  ) => ReturnType<A[K]>;
};

/** defineStore 配置：state 必填，getters / actions / persist 可选 */
export interface CreateStoreConfig<
  T extends Record<string, unknown>,
  G extends StoreGetters<T> = StoreGetters<T>,
  A extends Record<string, (...args: unknown[]) => unknown> = Record<
    string,
    (...args: unknown[]) => unknown
  >,
> {
  /** 初始状态（会被浅拷贝） */
  state: T;
  /** 派生只读：每个 getter 通过 this 读 state */
  getters?: G;
  /** 方法：通过 this 读 state；可直接 this.xxx = value 赋值（与 view store 一致），也可 this.setState；this 上可访问其他 action */
  actions?: StoreActions<T, A>;
  /** 持久化：初始化从 storage 恢复，set 后写入 */
  persist?: CreateStorePersistOptions<T>;
  /** 默认 true 返回单对象；false 返回 [get, set, getters?, actions?] 元组 */
  asObject?: boolean;
}

/** 订阅函数：state 变更时调用，返回取消订阅函数 */
export type StoreSubscribe = (listener: () => void) => () => void;

/** store 内置：setState、subscribe、getState，定义 StoreType 时可与自定义 state/getters/actions 交叉，不必手写 */
export type StoreBuiltIn<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  setState: (value: T | ((prev: T) => T)) => void;
  subscribe: StoreSubscribe;
  getState: () => T;
};

/** 非函数的键（省略第二泛型时自动当 state） */
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

/** 简洁写法：T 为整 store 形态，第二泛型可省略（自动把非函数键当 state，setState 接受 Partial） */
export type DefineStoreReturnType<
  T extends Record<string, unknown>,
  K extends keyof T = NonFunctionKeys<T> extends keyof T ? NonFunctionKeys<T>
    : keyof T,
> = Omit<StoreBuiltIn<Pick<T, K>> & T, "setState"> & {
  setState: (
    value: Partial<Pick<T, K>> | ((prev: Pick<T, K>) => Pick<T, K>),
  ) => void;
};

/** 仅 state 时返回对象形态 */
export type StoreAsObjectStateOnly<T extends Record<string, unknown>> = T & {
  setState: (value: T | ((prev: T) => T)) => void;
  /** 订阅 state 变更，用于 View/React/Preact 响应式联动 */
  subscribe: StoreSubscribe;
  /** 当前 state 快照（同一引用直至 setState），供 useSyncExternalStore 等使用 */
  getState: () => T;
};

/** state + getters 时返回对象形态 */
export type StoreAsObjectWithGetters<
  T extends Record<string, unknown>,
  G extends StoreGetters<T>,
> = T & {
  setState: (value: T | ((prev: T) => T)) => void;
  subscribe: StoreSubscribe;
  getState: () => T;
} & { [K in keyof G]: ReturnType<G[K]> };

/** state + actions 时返回对象形态 */
export type StoreAsObject<
  T extends Record<string, unknown>,
  A extends Record<string, (...args: unknown[]) => unknown>,
> = T & {
  setState: (value: T | ((prev: T) => T)) => void;
  subscribe: StoreSubscribe;
  getState: () => T;
} & A;

/** state + getters + actions 时返回对象形态 */
export type StoreAsObjectWithGettersAndActions<
  T extends Record<string, unknown>,
  G extends StoreGetters<T>,
  A extends Record<string, (...args: unknown[]) => unknown>,
> =
  & T
  & {
    setState: (value: T | ((prev: T) => T)) => void;
    subscribe: StoreSubscribe;
    getState: () => T;
  }
  & { [K in keyof G]: ReturnType<G[K]> }
  & A;

function defaultSerialize<T>(state: T): string {
  return JSON.stringify(state);
}

function defaultDeserialize<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

function getDefaultStorage(): StorageLike | null {
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return (globalThis as unknown as { localStorage: StorageLike })
      .localStorage;
  }
  return null;
}

/**
 * 定义 Store（与 view store 相同的调用方式）
 *
 * @param key - 唯一 key，同一 key 返回同一实例；也可用于 persist 默认 key
 * @param config - state 必填；可选 getters、actions、persist；asObject 默认 true
 * @returns [get, set] 或 [get, set, getters] 或 [get, set, actions] 或 [get, set, getters, actions]，或 asObject 时的单对象
 *
 * @example
 * const [get, set, getters, actions] = defineStore("counter", {
 *   state: { count: 0 },
 *   getters: { double() { return this.count * 2; } },
 *   actions: { increment(step = 1) { this.setState({ ...this, count: this.count + step }); } },
 *   asObject: false,
 * });
 * get().count;
 * actions.increment(2);
 */
export function defineStore<
  T extends Record<string, unknown>,
  G extends StoreGetters<T> = StoreGetters<T>,
  A extends Record<string, (...args: unknown[]) => unknown> = Record<
    string,
    (...args: unknown[]) => unknown
  >,
>(
  key: string,
  config: CreateStoreConfig<T, G, A>,
):
  | [getter: () => T, setter: (value: T | ((prev: T) => T)) => void]
  | [
    getter: () => T,
    setter: (value: T | ((prev: T) => T)) => void,
    getters: { [K in keyof G]: () => ReturnType<G[K]> },
  ]
  | [
    getter: () => T,
    setter: (value: T | ((prev: T) => T)) => void,
    actions: { [K in keyof A]: (...args: unknown[]) => ReturnType<A[K]> },
  ]
  | [
    getter: () => T,
    setter: (value: T | ((prev: T) => T)) => void,
    getters: { [K in keyof G]: () => ReturnType<G[K]> },
    actions: { [K in keyof A]: (...args: unknown[]) => ReturnType<A[K]> },
  ]
  | StoreAsObjectStateOnly<T>
  | StoreAsObjectWithGetters<T, G>
  | StoreAsObject<T, A>
  | StoreAsObjectWithGettersAndActions<T, G, A> {
  const existing = getGlobalStore(key);
  if (existing !== undefined) {
    return existing as
      | [getter: () => T, setter: (value: T | ((prev: T) => T)) => void]
      | StoreAsObjectStateOnly<T>
      | StoreAsObjectWithGetters<T, G>
      | StoreAsObject<T, A>
      | StoreAsObjectWithGettersAndActions<T, G, A>;
  }
  const {
    state: initial,
    getters: gettersConfig,
    actions: actionsConfig,
    persist: persistConfig,
    asObject = true,
  } = config;

  let state: T = { ...initial } as T;

  // 持久化：恢复
  const persistKey = persistConfig?.key ?? key;
  if (persistConfig) {
    const storage = persistConfig.storage ?? getDefaultStorage();
    const deserialize = persistConfig.deserialize ?? defaultDeserialize;
    if (storage) {
      try {
        const raw = storage.getItem(persistKey);
        if (raw != null && raw !== "") {
          const loaded = deserialize(raw) as T;
          if (loaded && typeof loaded === "object") {
            const merged = { ...initial } as T;
            for (const k of Object.keys(loaded) as (keyof T)[]) {
              if (
                (loaded as Record<string, unknown>)[k as string] !== undefined
              ) {
                merged[k] = loaded[k];
              }
            }
            state = merged;
          }
        }
      } catch {
        // 忽略
      }
    }
  }

  const getter = (): T => state;
  const listeners = new Set<() => void>();
  const subscribe: StoreSubscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const setter = (value: T | ((prev: T) => T)): void => {
    const prev = state;
    const next = typeof value === "function"
      ? (value as (prev: T) => T)(prev)
      : value;
    state = { ...next } as T;
    if (persistConfig) {
      const storage = persistConfig.storage ?? getDefaultStorage();
      const serialize = persistConfig.serialize ?? defaultSerialize;
      if (storage) {
        try {
          storage.setItem(persistKey, serialize(state));
        } catch {
          // 忽略
        }
      }
    }
    listeners.forEach((fn) => fn());
  };

  const hasGetters = !!gettersConfig && Object.keys(gettersConfig).length > 0;
  const hasActions = !!actionsConfig && Object.keys(actionsConfig).length > 0;
  let gettersObj: Record<string, () => unknown> | undefined;
  let actionsObj: Record<string, (...args: unknown[]) => unknown> | undefined;

  if (hasGetters && gettersConfig) {
    gettersObj = {};
    for (const [k, fn] of Object.entries(gettersConfig)) {
      if (typeof fn === "function") {
        gettersObj[k] = () => (fn as (this: T) => unknown).call(getter());
      }
    }
  }

  if (hasActions && actionsConfig) {
    actionsObj = {};
    /** action 内 this 的 Proxy：读 state 走 getter，写 state 走 setter(merge)，支持直接 this.xxx = value（与 view store 一致） */
    const buildCtx = (): StoreActionContext<T, A> =>
      new Proxy({} as StoreActionContext<T, A>, {
        get(_, prop: string | symbol) {
          if (prop === "setState") return setter;
          if (
            typeof prop === "string" &&
            actionsObj &&
            Object.prototype.hasOwnProperty.call(actionsObj, prop)
          ) {
            return actionsObj[prop];
          }
          return (getter() as Record<string, unknown>)[prop as string];
        },
        set(_, prop: string | symbol, value: unknown) {
          if (prop === "setState") return true;
          if (
            typeof prop === "string" &&
            actionsObj &&
            Object.prototype.hasOwnProperty.call(actionsObj, prop)
          ) {
            return true;
          }
          setter({
            ...(getter() as Record<string, unknown>),
            [prop as string]: value,
          } as T);
          return true;
        },
      });
    for (const [k, fn] of Object.entries(actionsConfig)) {
      if (typeof fn === "function") {
        actionsObj[k] = (...args: unknown[]) =>
          (fn as (this: StoreActionContext<T, A>, ...a: unknown[]) => unknown)
            .call(buildCtx(), ...args);
      }
    }
  }

  const register = (result: unknown) => {
    setGlobalStore(key, result);
    return result;
  };

  if (asObject) {
    const storeObject = new Proxy(
      {} as StoreAsObjectWithGettersAndActions<T, G, A>,
      {
        get(_, prop: string | symbol) {
          if (prop === "setState") return setter;
          if (prop === "subscribe") return subscribe;
          if (prop === "getState") return getter;
          if (
            typeof prop === "string" &&
            actionsObj &&
            Object.prototype.hasOwnProperty.call(actionsObj, prop)
          ) {
            return actionsObj[prop];
          }
          if (
            typeof prop === "string" &&
            gettersObj &&
            Object.prototype.hasOwnProperty.call(gettersObj, prop)
          ) {
            return gettersObj[prop]!();
          }
          return (getter() as Record<string, unknown>)[prop as string];
        },
        set(_, prop: string | symbol, value: unknown) {
          if (
            prop === "setState" || prop === "subscribe" || prop === "getState"
          ) return true;
          if (
            typeof prop === "string" &&
            ((actionsObj &&
              Object.prototype.hasOwnProperty.call(actionsObj, prop)) ||
              (gettersObj &&
                Object.prototype.hasOwnProperty.call(gettersObj, prop)))
          ) {
            return true;
          }
          setter({ ...getter(), [prop as keyof T]: value } as T);
          return true;
        },
      },
    );
    if (hasGetters && hasActions) {
      return register(storeObject) as StoreAsObjectWithGettersAndActions<
        T,
        G,
        A
      >;
    }
    if (hasGetters) {
      return register(storeObject) as StoreAsObjectWithGetters<T, G>;
    }
    if (hasActions) {
      return register(storeObject) as StoreAsObject<T, A>;
    }
    return register(storeObject) as StoreAsObjectStateOnly<T>;
  }

  if (hasGetters && hasActions) {
    return register([
      getter,
      setter,
      gettersObj!,
      actionsObj!,
    ]) as [
      typeof getter,
      typeof setter,
      { [K in keyof G]: () => ReturnType<G[K]> },
      { [K in keyof A]: (...args: unknown[]) => ReturnType<A[K]> },
    ];
  }
  if (hasGetters) {
    return register([getter, setter, gettersObj!]) as [
      typeof getter,
      typeof setter,
      { [K in keyof G]: () => ReturnType<G[K]> },
    ];
  }
  if (hasActions) {
    return register([getter, setter, actionsObj!]) as [
      typeof getter,
      typeof setter,
      { [K in keyof A]: (...args: unknown[]) => ReturnType<A[K]> },
    ];
  }
  return register([getter, setter]) as [
    getter: () => T,
    setter: (value: T | ((prev: T) => T)) => void,
  ];
}
