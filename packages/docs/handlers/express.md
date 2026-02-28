# Express Watcher Handlers

Lens provides built-in handlers to monitor various aspects of your Express application, including database queries, cache operations, exceptions, and outgoing emails.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 1. Query Watcher

Capture database queries from popular ORMs by using built-in handlers.

### Prisma
```ts
import { createPrismaHandler } from "@lensjs/watchers";
// ...
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ prisma, provider: "mysql" }),
  },
});
```

### Kysely
```ts
import { createKyselyHandler, watcherEmitter } from "@lensjs/watchers";
// ...
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createKyselyHandler({ provider: "mysql" }),
  },
});
// In your Kysely config:
log(event) { watcherEmitter.emit("kyselyQuery", event); }
```

### Sequelize
```ts
import { createSequelizeHandler, watcherEmitter } from "@lensjs/watchers";
// ...
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: "mysql" }),
  },
});
// In your Sequelize config:
logging: (sql, timing) => { watcherEmitter.emit("sequelizeQuery", { sql, timing }); }
```

## 2. Cache Watcher

Monitor cache hits, misses, and writes. Set `cacheWatcherEnabled: true` and emit events from your cache driver.

```ts
import { watcherEmitter } from "@lensjs/watchers";

await lens({
  app,
  cacheWatcherEnabled: true,
});

// In your cache driver:
watcherEmitter.emit("cache", {
  action: "hit", // "hit" | "miss" | "write" | "delete" | "clear"
  key: "user:1",
  value: { id: 1, name: "John" },
});
```

## 3. Exception Watcher

The exception watcher is enabled by default (`exceptionWatcherEnabled: true`). It captures unhandled errors and displays them with stack traces and code frames.

```ts
const { handleExceptions } = await lens({ app });
handleExceptions(); // Register the error handler
```

## 4. Mail Watcher

Monitor outgoing emails sent via Nodemailer.

```ts
import { logNodeMailerEntry } from "@lensjs/watchers";

await lens({
  app,
  mailWatcherEnabled: true,
});

// After sending mail:
const info = await transporter.sendMail(payload);
await logNodeMailerEntry("smtp", payload, info);
```
