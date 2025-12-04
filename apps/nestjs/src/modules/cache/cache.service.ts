import { Inject, Injectable } from '@nestjs/common';
import { emitCacheEvent } from '@lensjs/watchers';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.cache.get<T>(key);

    if (value === undefined || value === null) {
      emitCacheEvent({
        action: 'miss',
        data: { key },
      });

      return null;
    }

    emitCacheEvent({
      action: 'hit',
      data: { key, value },
    });

    return value;
  }

  async has<T = unknown>(key: string): Promise<boolean> {
    let value = await this.cache.get<T>(key);
    if (value === undefined || value === null) {
      emitCacheEvent({
        action: 'miss',
        data: { key },
      });
      return false;
    }

    emitCacheEvent({
      action: 'hit',
      data: { key, value },
    });
    return true;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
    emitCacheEvent({
      action: 'write',
      data: { key, value, ttl },
    });
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
    emitCacheEvent({
      action: 'delete',
      data: { key },
    });
  }

  async clear(): Promise<void> {
    await this.cache.clear();
    emitCacheEvent({
      action: 'clear',
    });
  }
}
