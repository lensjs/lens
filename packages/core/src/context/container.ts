import type Store from "../abstracts/store";

type Factory<T = any> = () => T;

type ContextStore = {
  store: Store;
  uiConfig: {
    appName: string;
    path: string;
    api: {
      requests: string;
      queries: string;
    };
  };
};

export default class Container {
  private static bindings = new Map<keyof ContextStore, Factory>();
  private static singletons = new Map<keyof ContextStore, Factory>();
  private static instances = new Map<keyof ContextStore, any>();

  static bind<K extends keyof ContextStore>(
    key: K,
    factory: Factory<ContextStore[K]>,
  ) {
    this.bindings.set(key, factory);
  }

  static singleton<K extends keyof ContextStore>(
    key: K,
    factory: Factory<ContextStore[K]>,
  ) {
    this.singletons.set(key, factory);
  }

  static make<K extends keyof ContextStore>(key: K): ContextStore[K] {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    if (this.singletons.has(key)) {
      const instance = this.singletons.get(key)!();
      this.instances.set(key, instance);
      return instance;
    }

    if (this.bindings.has(key)) {
      return this.bindings.get(key)!();
    }

    throw new Error(`Service "${key}" is not bound in the container`);
  }

  static has(key: keyof ContextStore): boolean {
    return (
      this.bindings.has(key) ||
      this.singletons.has(key) ||
      this.instances.has(key)
    );
  }

  static clear(): void {
    this.bindings.clear();
    this.singletons.clear();
    this.instances.clear();
  }
}
