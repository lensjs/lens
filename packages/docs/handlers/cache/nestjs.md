# NestJS Cache Watcher

This guide explains how to integrate Lens's cache watcher with your NestJS application, leveraging NestJS's built-in caching mechanism via the `@nestjs/cache-manager` package. By following these steps, you'll be able to monitor cache operations directly within the Lens dashboard.

## 1. Prerequisites

First, install the necessary packages for NestJS caching and Lens watchers:

```bash
npm install @nestjs/cache-manager cache-manager @lensjs/watchers
```

## 2. Emitting Cache Events with a Custom Service

To enable Lens to monitor your cache operations, you need to wrap the `@nestjs/cache-manager` functionality within a custom service. This service will be responsible for emitting cache events to Lens each time a cache operation (e.g., `get`, `set`, `delete`) occurs. We'll use the `emitCacheEvent` function from `@lensjs/watchers` to dispatch these events.

Here's an example implementation of a `CacheService` that integrates with `@nestjs/cache-manager` and emits Lens cache events:

## 3. Cache Service Implementation

This `CacheService` wraps the `@nestjs/cache-manager`'s `Cache` instance. Each method (`get`, `has`, `set`, `del`, `clear`) is augmented to call `emitCacheEvent` with relevant details before or after performing the actual cache operation. This ensures that Lens receives a comprehensive log of all cache interactions.

```ts
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
```

## 5. Enable Lens Cache Watcher

Finally, ensure that the `cacheWatcherEnabled` option is set to `true` in your `main.ts` file when initializing Lens. This activates the cache watcher, allowing Lens to process the events emitted by your `CacheService`.

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await lens({
    adapter: 'fastify',
    app,
    cacheWatcherEnabled: true, // Ensure this is set to true
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## 6. Verification (Optional Controller)

To verify that your cache watcher is working correctly, you can use a simple controller to interact with your `CacheService`. This controller exposes endpoints to perform various cache operations, which will trigger events visible in the Lens dashboard.

Create a file `src/modules/cache/cache.controller.ts` (if you haven't already) with the following content:

```ts
import { Controller, Get } from '@nestjs/common';
import { CacheService } from './cache.service.js';

@Controller('cache') // Added a base path for clarity
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('/get')
  async getValue() {
    const value = await this.cacheService.get('test');
    return { key: 'test', value };
  }

  @Get('/set')
  async setValue() {
    await this.cacheService.set('test', { hello: 'world' });
    return { message: 'Value set' };
  }

  @Get('/has')
  async hasValue() {
    const hasValue = await this.cacheService.has('test');
    return { hasValue };
  }

  @Get('/delete')
  async deleteKey() {
    await this.cacheService.del('test');
    return { message: 'Key deleted' };
  }

  @Get('/clear')
  async clearCache() {
    await this.cacheService.clear();
    return { message: 'Cache cleared' };
  }
}
```

### Try it out

1.  Start your NestJS application.
2.  Access the cache endpoints (e.g., `http://localhost:3000/cache/set`, `http://localhost:3000/cache/get`) in your browser or with a tool like Postman.
3.  Navigate to `http://localhost:3000/lens/cache` in your browser to view the captured cache events in the Lens dashboard.

## 7. Next Steps

*   Explore more advanced cache configurations for `@nestjs/cache-manager`.
*   Integrate with other cache stores (e.g., Redis) by adapting the `CacheService` to use their respective clients while still emitting Lens cache events.
