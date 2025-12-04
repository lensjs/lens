# Express Cache Watcher

To monitor cache operations in an Express application with Lens, you need a centralized cache store that can emit cache log events. This guide demonstrates how to integrate a simple in-memory cache store that emits events using `@lensjs/watchers`.

## Emitting Cache Events

The `emitCacheEvent` function from the `@lensjs/watchers` package is used to dispatch cache events to Lens. Below is an example of a `MemoryCache` class that integrates this functionality:

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

## Usage Example

Here's how you can integrate the `MemoryCache` into your Express application and enable the cache watcher:

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

You can adapt this `MemoryCache` example to integrate with other cache stores like Redis or MongoDB by ensuring they emit events using `emitCacheEvent` at appropriate points (e.g., on `get`, `set`, `delete`).