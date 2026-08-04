---
outline: deep
---

# Cache Watcher

<p class="lens-lead">
The cache watcher records every cache operation — <strong>hits</strong>, <strong>misses</strong>,
<strong>writes</strong>, <strong>deletes</strong>, and <strong>clears</strong> — and correlates
each event to the request that triggered it, so you can see exactly how your cache behaves from
inside the Lens dashboard.
</p>

<Callout type="info" title="Enable it">
Cache capture is <strong>off by default</strong>. Turn it on by setting
<code>cacheWatcherEnabled: true</code> on your adapter (Express, Fastify, NestJS) — or the
<code>watchers.cache</code> option on AdonisJS. Each tab below shows exactly where.
</Callout>

## Setup

<Callout type="tip" title="How cache events reach Lens">
On Express, Fastify, and NestJS you emit events yourself with <code>emitCacheEvent</code> from
<code>@lensjs/watchers</code> — call it on every <code>hit</code>, <code>miss</code>,
<code>write</code>, <code>delete</code>, and <code>clear</code>. AdonisJS needs none of this: Lens
listens to its native cache events automatically. Pick your framework below.
</Callout>

<CodeTabs :tabs="['Express', 'Fastify', 'NestJS', 'AdonisJS']">
<template #Express>

Install the watchers package, which provides the `emitCacheEvent` helper:

<CommandCopy pkg="@lensjs/watchers" />

<Steps>
<Step title="Emit cache events from your store">

Below is a `MemoryCache` class that emits cache events to Lens on every operation:

```ts
import { emitCacheEvent } from "@lensjs/watchers";

export default class MemoryCache {
  private cache!: Map<string, any>;

  public setup() {
    this.cache = new Map();
  }

  public get(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    }
    else {
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

  public set<T extends any>(key: string, value: T) {
    emitCacheEvent({
      action: "write",
      data: {
        key,
        value,
      },
    });

    this.cache.set(key, value);
  }

  public delete(key: string) {
    emitCacheEvent({
      action: "delete",
      data: {
        key,
      },
    });
    this.cache.delete(key);
  }

  public has(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    }
    else {
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

  public clear() {
    emitCacheEvent({
      action: "clear",
    });

    this.cache.clear();
  }
}
```

</Step>
<Step title="Enable the cache watcher">

Integrate the `MemoryCache` into your Express application and enable the cache watcher:

```ts
import express from "express";
import { lens } from "@lensjs/express";
import MemoryCache from "./concrete/cache/memory_cache"; // Assuming this path to your MemoryCache class

const app = express();
const port = 3000;
const cache = new MemoryCache();

await lens({
  app,
  cacheWatcherEnabled: true, // Enable the cache watcher
});

cache.setup();

// Example Cache Routes
app.get("/set-cache",  (_, res) => {
  res.json({
    result: cache.set("randomKey", {
      hello: "world",
    }),
  });
});

app.get("/has-cache",  (_, res) => {
  res.json({
    result: cache.has("randomKey"),
  });
});

app.get("/get-cache",  (_, res) => {
  res.json({
    result: cache.get("randomKey"),
  });
});

app.get("/delete-cache",  (_, res) => {
  res.json({
    result: cache.delete("randomKey"),
  });
});

app.get("/clear-cache",  (_, res) => {
  res.json({
    result: cache.clear(),
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
```

</Step>
</Steps>

</template>
<template #Fastify>

Install the watchers package, which provides the `emitCacheEvent` helper:

<CommandCopy pkg="@lensjs/watchers" />

<Steps>
<Step title="Emit cache events from your store">

Below is a `MemoryCache` class that emits cache events to Lens on every operation:

```ts
import { emitCacheEvent } from "@lensjs/watchers";

export default class MemoryCache {
  private cache!: Map<string, any>;

  public setup() {
    this.cache = new Map();
  }

  public get(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    }
    else {
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

  public set<T extends any>(key: string, value: T) {
    emitCacheEvent({
      action: "write",
      data: {
        key,
        value,
      },
    });

    this.cache.set(key, value);
  }

  public delete(key: string) {
    emitCacheEvent({
      action: "delete",
      data: {
        key,
      },
    });
    this.cache.delete(key);
  }

  public has(key: string) {
    const item = this.cache.get(key);

    if (!item) {
      emitCacheEvent({
        action: "miss",
        data: {
          key,
        },
      });
    }
    else {
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

  public clear() {
    emitCacheEvent({
      action: "clear",
    });

    this.cache.clear();
  }
}
```

</Step>
<Step title="Enable the cache watcher">

Integrate the `MemoryCache` into your Fastify application and enable the cache watcher:

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import MemoryCache from "./concrete/cache/memory_cache"; // Assuming this path to your MemoryCache class

const app = Fastify();
const port = 3000;
const cache = new MemoryCache();

await lens({
  app,
  cacheWatcherEnabled: true, // Enable the cache watcher
});

cache.setup();

// Example Cache Routes
app.get("/set-cache",  async (_, reply) => {
  reply.send({
    result: cache.set("randomKey", {
      hello: "world",
    }),
  });
});

app.get("/has-cache",  async (_, reply) => {
  reply.send({
    result: cache.has("randomKey"),
  });
});

app.get("/get-cache",  async (_, reply) => {
  reply.send({
    result: cache.get("randomKey"),
  });
});

app.get("/delete-cache",  async (_, reply) => {
  reply.send({
    result: cache.delete("randomKey"),
  });
});

app.get("/clear-cache",  async (_, reply) => {
  reply.send({
    result: cache.clear(),
  });
});

await app.listen({ port });
console.log(`Server is running at http://localhost:${port}`);
```

</Step>
</Steps>

</template>
<template #NestJS>

Install the NestJS caching packages and the Lens watchers package:

<CommandCopy pkg="@nestjs/cache-manager cache-manager @lensjs/watchers" />

<Steps>
<Step title="Emit cache events with a custom service">

To enable Lens to monitor your cache operations, wrap the `@nestjs/cache-manager` functionality
within a custom service. This service is responsible for emitting cache events to Lens each time a
cache operation (e.g. `get`, `set`, `delete`) occurs, using the `emitCacheEvent` function from
`@lensjs/watchers`.

This `CacheService` wraps the `@nestjs/cache-manager`'s `Cache` instance. Each method (`get`,
`has`, `set`, `del`, `clear`) is augmented to call `emitCacheEvent` with relevant details before
or after performing the actual cache operation. This ensures that Lens receives a comprehensive
log of all cache interactions.

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

</Step>
<Step title="Enable the Lens cache watcher">

Set the `cacheWatcherEnabled` option to `true` in your `main.ts` file when initializing Lens. This
activates the cache watcher, allowing Lens to process the events emitted by your `CacheService`.

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

</Step>
<Step title="Verify with an optional controller">

To verify that your cache watcher is working correctly, use a simple controller to interact with
your `CacheService`. This controller exposes endpoints to perform various cache operations, which
will trigger events visible in the Lens dashboard.

Create a file `src/modules/cache/cache.controller.ts` (if you haven't already) with the following
content:

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

</Step>
</Steps>

Once everything is wired up, start the app and hit the endpoints to watch events land:

<TerminalWindow title="try it out">
<p><span class="c-dim"># 1.</span> Start your NestJS application</p>
<p><span class="c-dim"># 2.</span> Hit the cache endpoints (browser or Postman)</p>
<p><span class="c-blue">http://localhost:3000/cache/set</span></p>
<p><span class="c-blue">http://localhost:3000/cache/get</span></p>
<p><span class="c-dim"># 3.</span> Open the dashboard</p>
<p><span class="c-green">http://localhost:3000/lens/cache</span> <span class="c-dim"><Icon name="check" :size="12" /> cache events captured</span></p>
</TerminalWindow>

</template>
<template #AdonisJS>

<Callout type="info" title="Prerequisite">
Install and set up the <a href="https://docs.adonisjs.com/guides/digging-deeper/cache#installation" target="_blank" rel="noreferrer">AdonisJS Cache</a> package in your project before enabling the watcher.
</Callout>

Once AdonisJS Cache is set up, enable the `cache` option within the `watchers` section of your
`config/lens.ts` file. This allows Lens to automatically capture cache-related events.

```ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  // ... other config
  watchers: {
    // Enable cache watching. This can be controlled via the LENS_ENABLE_CACHE_WATCHER environment variable.
    cache: env.get('LENS_ENABLE_CACHE_WATCHER', true),
  },
})

export default lensConfig
```

<Callout type="success" title="Automatic integration">
Lens automatically integrates with AdonisJS by listening to its internal cache events. This
seamless integration means all cache operations (like <code>hit</code>, <code>miss</code>,
<code>set</code>, <code>forget</code>, <code>cleared</code>) are automatically captured and
displayed in the Lens UI for real-time monitoring and analysis. For more details on AdonisJS
events, refer to the <a href="https://docs.adonisjs.com/guides/references/events#cachedeleted" target="_blank" rel="noreferrer">AdonisJS Events documentation</a>.
</Callout>

</template>
</CodeTabs>

<Callout type="tip" title="Other cache stores">
Adapt these examples to Redis, MongoDB, or any other backend by emitting events with
<code>emitCacheEvent</code> at the right points (e.g. on <code>get</code>, <code>set</code>,
<code>delete</code>). On AdonisJS this happens automatically once its cache is configured.
</Callout>

## Next steps

<CardGrid :cols="2">
  <Card icon="layers" title="All watchers" href="/watchers/">
    Explore every signal Lens can capture — queries, exceptions, mail, jobs, and more.
  </Card>
  <Card icon="settings" title="Configuration" href="/configuration">
    All adapter options, including <code>cacheWatcherEnabled</code>, sampling, retention, and security.
  </Card>
</CardGrid>
