# Drizzle Query Watcher Handler

Capture queries from **Drizzle ORM** with `createDrizzleHandler` and `createLensDrizzleLogger`. The handler is framework-agnostic — use it with any Lens adapter (Express, Fastify, Hono, NestJS, AdonisJS).

## 1. Install Packages

```bash
npm install @lensjs/watchers drizzle-orm
```

## 2. Usage

Pass the Lens logger to `drizzle(...)` so every query is captured in the request context, and register `createDrizzleHandler` on the query watcher.

```ts
import { lens } from "@lensjs/express";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  createDrizzleHandler,
  createLensDrizzleLogger,
} from "@lensjs/watchers";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Use this `db` instance everywhere you query.
export const db = drizzle(pool, { logger: createLensDrizzleLogger() });

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createDrizzleHandler({ provider: "postgresql" }),
  },
});
```

`provider` is one of `"postgresql"`, `"mysql"`, or `"sqlite"`.

> **Why `createLensDrizzleLogger`?** Drizzle calls its `Logger.logQuery` synchronously at query-issue time, so Lens captures the request id **in-context** there, guaranteeing correct correlation. Drizzle's logger interface does not expose a duration, so queries are recorded with a `0 ms` duration.
