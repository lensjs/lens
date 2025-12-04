export default abstract class Cache {
  async setup(): Promise<void> {}
  abstract get<T extends any>(key: string): Promise<T|null>;
  abstract set<T extends any>(key: string, value: T): void;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract has(key: string): Promise<boolean>;
}
