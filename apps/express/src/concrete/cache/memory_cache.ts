import Cache from "../../abstracts/cache_abstract";
import { emitCacheEvent } from "@lensjs/watchers";

export default class MemoryCache extends Cache {
  private cache!: Map<string, any>;

  public async setup() {
    this.cache = new Map();
  }

  public async get(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    } else {
      emitCacheEvent({
        action: "hit",
        data: {
          key,
          value: item,
        },
      });
    }

    return item;
  }

  public async set<T extends any>(key: string, value: T) {
    emitCacheEvent({
      action: "write",
      data: {
        key,
        value,
      },
    });

    this.cache.set(key, value);
  }

  public async delete(key: string) {
    emitCacheEvent({
      action: "delete",
      data: {
        key,
      },
    });
    this.cache.delete(key);
  }

  public async has(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    } else {
      emitCacheEvent({
        action: "hit",
        data: {
          key,
          value: item,
        },
      });
    }

    return item !== undefined;
  }

  public async clear() {
    emitCacheEvent({
      action: "clear",
    });

    this.cache.clear();
  }
}
