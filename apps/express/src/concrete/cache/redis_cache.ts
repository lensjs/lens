import Cache from "../../abstracts/cache_abstract";
import { emitCacheEvent } from "@lensjs/watchers";
import Redis from "ioredis";

export default class RedisCache extends Cache {
  private client!: Redis;

  public async setup() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0"),
    });
  }

  public async get<T extends any>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    const item = raw ? (JSON.parse(raw) as T) : null;

    if (item === null) {
      emitCacheEvent({
        action: "miss",
        data: { key },
      });
    } else {
      emitCacheEvent({
        action: "hit",
        data: { key, value: item },
      });
    }

    return item;
  }

  public async set<T extends any>(key: string, value: T): Promise<void> {
    await this.client.set(key, JSON.stringify(value));

    emitCacheEvent({
      action: "write",
      data: { key, value },
    });
  }

  public async delete(key: string): Promise<void> {
    await this.client.del(key);

    emitCacheEvent({
      action: "delete",
      data: { key },
    });
  }

  public async has(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);

    if (!exists) {
      emitCacheEvent({
        action: "miss",
        data: { key },
      });
    } else {
      const value = await this.get(key);
      emitCacheEvent({
        action: "hit",
        data: { key, value },
      });
    }

    return exists === 1;
  }

  public async clear(): Promise<void> {
    await this.client.flushdb();

    emitCacheEvent({
      action: "clear",
    });
  }
}
