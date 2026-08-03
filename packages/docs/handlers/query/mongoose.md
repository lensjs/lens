# Mongoose Query Watcher Handler

Capture MongoDB operations from **Mongoose** with `createMongooseHandler` and `attachMongooseLens`. The handler is framework-agnostic — use it with any Lens adapter (Express, Fastify, Hono, NestJS, AdonisJS).

## 1. Install Packages

```bash
npm install @lensjs/watchers mongoose
```

## 2. Usage

Attach Lens to Mongoose so operations correlate to the request that issued them, then register `createMongooseHandler` on the query watcher.

```ts
import { lens } from "@lensjs/express";
import mongoose from "mongoose";
import { createMongooseHandler, attachMongooseLens } from "@lensjs/watchers";

// Correlates each operation to the request that issued it.
attachMongooseLens(mongoose);
await mongoose.connect(process.env.MONGO_URL!);

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createMongooseHandler(),
  },
});
```

Operations are recorded as `collection.method(args)` with the `mongodb` provider (no SQL formatting is applied).

> **Why `attachMongooseLens`?** It enables Mongoose's `debug` hook, which fires **in-context** at query-issue time, so Lens captures the request id correctly. The hook does not expose a duration, so operations are recorded with a `0 ms` duration.
