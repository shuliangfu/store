/**
 * @module @dreamer/store
 *
 * 客户端状态管理库，提供响应式状态管理功能。
 *
 * 特性：
 * - Store（类似 Zustand）
 * - Signals（类似 Preact Signals）
 * - 持久化（localStorage、sessionStorage）
 * - 中间件支持
 * - Selectors（选择器）
 * - 类型安全
 *
 * 环境兼容性：
 * - 服务端：❌ 不支持（纯客户端状态管理库）
 * - 客户端：✅ 支持（浏览器环境）
 */


/**
 * Store 状态更新函数
 */
export type StateUpdater<T> = Partial<T> | ((state: T) => Partial<T> | void);

/**
 * Store 创建函数
 * @param set - 更新状态的函数（可以直接使用 this.property = value 修改属性，会自动同步）
 * @param get - 获取当前状态的函数（可以直接使用 this.property 访问属性）
 * @param api - Store API 对象（可选），包含所有方法和状态，可以使用 api.method() 调用方法
 *
 * 注意：虽然 set 和 get 参数是必需的，但在方法中可以直接使用 this.property = value 修改属性，
 * 系统会自动通过 Proxy 拦截并同步到 store，无需手动调用 set()
 *
 * 可以使用两种方式调用方法：
 * - this.method() - 推荐，更简洁
 * - api.method() - 可选，在某些场景下可能更清晰
 *
 * @template T - Store 的状态类型，包含所有属性和方法
 */
export type StoreCreator<T> = (
  set: (updater: StateUpdater<T>) => void,
  get: () => T,
  api?: T,
) => T;

/**
 * Store 订阅函数
 */
export type StoreSubscribe<T> = (listener: (state: T) => void) => () => void;

/**
 * Store Hook 函数
 * 这是一个可调用的函数，同时也是一个对象，包含 getState、setState、subscribe 方法
 */
export interface StoreHook<T, U = T> {
  (selector?: (state: T) => U): U extends T ? T : U;
  getState: () => T;
  setState: (updater: StateUpdater<T>) => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

/**
 * 中间件函数
 */
export type Middleware<T> = (
  config: StoreCreator<T>,
) => StoreCreator<T>;

/**
 * 持久化选项
 */
export interface PersistOptions {
  /** 存储键名 */
  name: string;
  /** 存储类型（localStorage 或 sessionStorage） */
  storage?: "localStorage" | "sessionStorage";
  /** 要持久化的字段（默认全部） */
  partialize?: (state: any) => any;
}

/**
 * Store 类
 */
class Store<T> {
  private state: T;
  private listeners: Set<(state: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * 获取当前状态
   */
  getState(): T {
    return this.state;
  }

  /**
   * 设置状态
   */
  setState(updater: StateUpdater<T>): void {
    let nextState: T;

    if (typeof updater === "function") {
      const result = updater(this.state);
      if (result === undefined || result === null) {
        // 如果返回 void 或 null，不更新状态
        return;
      }
      // result 是 Partial<T>，确保是对象类型
      if (typeof result === "object" && result !== null) {
        nextState = { ...this.state, ...result } as T;
      } else {
        return;
      }
    } else {
      // updater 是 Partial<T> 对象
      if (typeof updater === "object" && updater !== null) {
        nextState = { ...this.state, ...updater } as T;
      } else {
        return;
      }
    }

    if (nextState !== this.state) {
      this.state = nextState;
      this.listeners.forEach((listener) => listener(this.state));
    }
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * 定义并创建 Store
 *
 * 使用显式类型定义可以获得完整的 IDE 支持（代码跟踪、类型检查等）：
 * ```typescript
 * interface StoreType {
 *   count: number;
 *   increment: () => void;
 * }
 * const useStore = defineStore<StoreType>((set, get, api) => ({
 *   count: 0,
 *   increment: function() {
 *     this.count++; // this 类型正确，IDE 支持完整代码跟踪
 *   }
 * }));
 * ```
 *
 * 也可以不传泛型类型，让 TypeScript 自动推断（但可能无法获得完整的 IDE 支持）：
 * ```typescript
 * const useStore = defineStore((set, get, api) => ({
 *   count: 0,
 *   increment: function() {
 *     this.count++; // 类型推断可能不完整
 *   }
 * }));
 * ```
 *
 * @template T - Store 的状态类型，包含所有属性和方法
 * @param creator - Store 创建函数，返回包含状态和方法的对象
 * @param middleware - 可选的中间件数组，用于扩展 Store 功能
 * @returns StoreHook 对象，包含 getState、setState、subscribe 方法和可调用函数
 */
export function defineStore<T extends object>(
  creator: StoreCreator<T>,
  middleware?: Middleware<T>[],
): StoreHook<T> {
  // 应用中间件
  let finalCreator = creator as StoreCreator<T>;
  if (middleware && middleware.length > 0) {
    for (let i = middleware.length - 1; i >= 0; i--) {
      finalCreator = middleware[i](finalCreator);
    }
  }

  // 创建 Store
  const storeInstance = new Store<T>({} as T);

  // 创建 set 和 get 函数
  const setState = (updater: StateUpdater<T>) => {
    storeInstance.setState(updater);
  };

  const getState = () => storeInstance.getState();

  // 先创建一个临时的 API 对象，用于第一次调用 creator
  // 这个对象会在后续被替换为响应式对象
  let tempApi: T = {} as T;

  // 初始化状态（第一次调用，tempApi 还是空的，但类型正确）
  const initialState = finalCreator(setState, getState, tempApi);

  // 更新 store 状态
  storeInstance.setState(() => initialState);

  // 获取当前状态
  const currentState = storeInstance.getState();

  // 使用 Proxy 创建响应式对象，拦截属性设置
  // 当通过 this.property = value 修改属性时，自动更新 store
  const reactiveState = new Proxy(currentState, {
    set(target, prop, value) {
      // 设置属性值
      (target as any)[prop] = value;
      // 自动更新 store 状态
      storeInstance.setState(() => ({ ...target } as Partial<T>));
      return true;
    },
    get(target, prop) {
      return (target as any)[prop];
    },
  }) as T;

  // 更新 tempApi 为响应式对象，这样如果 creator 中使用了 api 参数，也能正常工作
  // 注意：由于 creator 只调用一次，这里主要是为了类型安全
  // 实际使用中，建议使用 this.method() 而不是 api.method()
  tempApi = reactiveState;

  // 绑定方法，使方法可以通过 this 访问整个对象
  // 遍历所有属性，如果是函数，则绑定到响应式对象
  const boundState = { ...reactiveState } as T;
  for (const key in boundState) {
    if (Object.prototype.hasOwnProperty.call(boundState, key)) {
      const value = boundState[key];
      if (typeof value === "function") {
        // 将方法绑定到响应式对象，这样方法中的 this 就指向响应式对象
        (boundState as any)[key] = value.bind(reactiveState);
      }
    }
  }

  // 更新 store 状态为绑定后的对象
  storeInstance.setState(() => boundState);

  // 创建 Hook 函数
  const hookFn = (selector?: (state: T) => any) => {
    if (!selector) {
      return storeInstance.getState();
    }

    // 使用 selector 选择部分状态
    // 注意：这里简化实现，实际应该使用响应式系统来避免不必要的更新
    return selector(storeInstance.getState());
  };

  // 创建完整的 StoreHook 对象
  // 使用类型断言确保类型正确，这样 IDE 能够正确识别类型
  // 关键：getState 返回的对象类型必须是 T，这样 IDE 才能识别方法中 this 的类型
  const useStore = Object.assign(hookFn, {
    // 返回绑定后的状态对象，确保类型为 T
    // 这样当调用 getState() 时，返回的对象类型是 T，IDE 能够识别
    getState: (): T => {
      const state = storeInstance.getState();
      // 确保返回的对象类型正确，帮助 IDE 进行代码跟踪
      return state as T;
    },
    setState: (updater: StateUpdater<T>) => storeInstance.setState(updater),
    subscribe: (listener: (state: T) => void) =>
      storeInstance.subscribe(listener),
  }) as StoreHook<T>;

  return useStore;
}

/**
 * Signal 类型
 */
export interface Signal<T> {
  value: T;
}

/**
 * Computed 类型
 */
export interface Computed<T> {
  value: T;
}

/**
 * 创建 Signal
 */
export function signal<T>(initialValue: T): Signal<T> {
  const listeners = new Set<() => void>();
  let value = initialValue;

  return {
    get value() {
      // 这里应该追踪依赖，简化实现
      return value;
    },
    set value(newValue: T) {
      if (value !== newValue) {
        value = newValue;
        listeners.forEach((listener) => listener());
      }
    },
  } as Signal<T>;
}

/**
 * 创建 Computed
 */
export function computed<T>(fn: () => T): Computed<T> {
  let value: T;
  let dirty = true;

  const update = () => {
    if (dirty) {
      value = fn();
      dirty = false;
    }
  };

  return {
    get value() {
      update();
      return value;
    },
  } as Computed<T>;
}

/**
 * Effect 函数
 */
export function effect(fn: () => void): () => void {
  // 简化实现，实际应该追踪依赖
  fn();
  return () => {
    // 清理函数
  };
}

/**
 * 持久化中间件
 */
export function persist<T extends object>(
  creator: StoreCreator<T>,
  options: PersistOptions,
): StoreCreator<T> {
  const storage = options.storage === "sessionStorage"
    ? globalThis.sessionStorage
    : globalThis.localStorage;

  // 尝试从存储恢复状态
  let persistedState: Partial<T> = {};
  try {
    const stored = storage.getItem(options.name);
    if (stored) {
      persistedState = JSON.parse(stored);
    }
  } catch {
    // 忽略解析错误
  }

  return (set, get, api) => {
    // 先创建初始状态
    const initialState = creator(set, get, api);
    // 合并持久化状态（覆盖初始状态）
    const mergedState = { ...initialState, ...persistedState } as T;

    // 保存状态到存储
    const saveState = () => {
      try {
        const state = get();
        const toSave = options.partialize ? options.partialize(state) : state;
        storage.setItem(options.name, JSON.stringify(toSave));
      } catch {
        // 忽略存储错误
      }
    };

    // 监听状态变化，自动保存
    // 注意：这里简化实现，实际应该集成到 store 的 subscribe 中
    // 可以通过包装 set 函数来实现自动保存
    const wrappedSet: typeof set = (updater) => {
      set(updater);
      saveState();
    };

    // 监听存储变化（跨标签页同步）
    // StorageEvent 是浏览器 API，在服务端不可用，需要定义接口
    interface StorageEvent {
      key: string | null;
      newValue: string | null;
      oldValue: string | null;
      storageArea: Storage | null;
    }

    const handleStorageChange = (e: Event) => {
      const storageEvent = e as unknown as StorageEvent;
      if (storageEvent.key === options.name && storageEvent.newValue) {
        try {
          const newState = JSON.parse(storageEvent.newValue);
          wrappedSet(() => newState);
        } catch {
          // 忽略解析错误
        }
      }
    };

    // 使用类型断言，因为 Deno 的类型定义可能不包含 storage 事件
    (globalThis as any).addEventListener("storage", handleStorageChange);

    // 绑定方法，使方法可以通过 this 访问整个对象
    const boundState = { ...mergedState } as T;
    for (const key in boundState) {
      if (Object.prototype.hasOwnProperty.call(boundState, key)) {
        const value = boundState[key];
        if (typeof value === "function") {
          (boundState as any)[key] = value.bind(boundState);
        }
      }
    }

    // 设置合并后的状态，并返回
    set(() => boundState);
    return boundState;
  };
}

/**
 * 日志中间件
 */
export function logger<T extends object>(
  creator: StoreCreator<T>,
): StoreCreator<T> {
  return (set, get, api) => {
    const wrappedSet: typeof set = (updater) => {
      set(updater);
      const nextState = get();
      console.log("[Store] State updated:", nextState);
    };

    return creator(wrappedSet, get, api);
  };
}

/**
 * 开发工具中间件
 */
export function devtools<T extends object>(
  creator: StoreCreator<T>,
  options?: { name?: string },
): StoreCreator<T> {
  const name = options?.name || "Store";

  return (set, get, api) => {
    // 简化实现，实际应该集成 Redux DevTools
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as any).__REDUX_DEVTOOLS_EXTENSION__
    ) {
      const devTools = (globalThis as any).__REDUX_DEVTOOLS_EXTENSION__.connect(
        {
          name,
        },
      );

      const wrappedSet: typeof set = (updater) => {
        set(updater);
        const nextState = get();
        devTools.send("SET_STATE", nextState);
      };

      return creator(wrappedSet, get, api);
    }

    return creator(set, get, api);
  };
}
