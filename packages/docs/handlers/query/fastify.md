# Fastify Query Watcher Handlers

Lens provides built-in handlers to monitor database queries from popular ORMs within your Fastify application. This guide covers how to integrate these handlers and also how to create custom ones.

## Prerequisites

Before using the built-in query watcher handlers, ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

This package supports popular ORMs out of the box, allowing you to easily plug them into the Lens ecosystem.

## Built-in Handlers

### 1. Prisma

Capture queries from **Prisma** by wrapping your client with `withLensPrisma` and registering `createPrismaHandler`.

**Prerequisites:**
Follow the official Prisma documentation to install Prisma in your project and then [Install Prisma Client](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/install-prisma-client-typescript-planetscale).

**Usage Example (Fastify + Prisma):**

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import { withLensPrisma, createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = Fastify();

// Wrap the client so every query is captured inside the request context.
// Use this `prisma` instance everywhere you access the database.
export const prisma = withLensPrisma(new PrismaClient(), { provider: "mysql" });

await lens({
  app,
  queryWatcher: {
    enabled: true, // Enable the query watcher
    handler: createPrismaHandler({
      provider: "mysql", // Specify your database provider
    }),
  },
});
```

> **Why `withLensPrisma`?** Prisma's query engine emits its `$on("query")` events across a native boundary that loses Node's async context, so those raw-SQL events cannot be reliably attached to the request that triggered them. `withLensPrisma` captures the request id **at query-issue time** (in-context) via a [Prisma Client extension](https://www.prisma.io/docs/orm/prisma-client/client-extensions), guaranteeing correct correlation even under concurrency. It logs the Prisma operation (e.g. `user.findMany({...})`) with a precise duration.
>
> The legacy `createPrismaHandler({ prisma, provider })` form still works (raw SQL via `$on`), but it **cannot correlate** queries to requests. Prefer the wrapper.

### 2. Kysely

Capture queries from **Kysely** by using `createKyselyHandler` with `createLensKyselyPlugin`.

**Dependencies:**

```bash
npm install kysely mysql2
```

**Usage Example (Fastify + Kysely):**

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import {
  createKyselyHandler,
  createLensKyselyPlugin,
  watcherEmitter,
} from "@lensjs/watchers";

const app = Fastify();

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createKyselyHandler({
       provider: "mysql" ,
       logQueryErrorsToConsole: true, // Optional: Log query errors to the console (default is true)
    }),
  },
});

interface Database {
  user: { name: string };
}

const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: "DB_HOST",
      user: "DB_USER",
      password: "DB_PASSWORD",
      database: "DB_NAME",
    }),
  }),
  // Captures the request id in-context at compile time.
  plugins: [createLensKyselyPlugin()],
  log(event) {
    watcherEmitter.emit("kyselyQuery", event); // Emit Kysely query events to Lens
  },
});
```

> **Why `createLensKyselyPlugin`?** Kysely's `log` callback fires from the driver's detached completion context, so it can't see the request that issued the query. The plugin captures the request id in-context when the query is compiled and links it to the log event via Kysely's `queryId`. Without it, queries are recorded but not correlated to their request.

### 3. Sequelize

Capture queries from **Sequelize** by using `createSequelizeHandler`.

**Dependencies:**

```bash
npm install sequelize
```

**Usage Example (Fastify + Sequelize):**

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import { Sequelize } from "sequelize";
import { createSequelizeHandler, attachSequelizeLens } from "@lensjs/watchers";

const app = Fastify();

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: "mysql" }),
  },
});

const sequelize = new Sequelize("DB_NAME", "DB_USER", "DB_PASSWORD", {
  host: "localhost",
  dialect: "mysql",
  benchmark: true,
  logQueryParameters: true,
});

// Correlates each query to the request that issued it.
attachSequelizeLens(sequelize);
```

> **Why `attachSequelizeLens`?** Sequelize's `logging` callback fires from the driver's detached completion context (the async context is lost for real/pooled databases), so it can't be attached to the originating request. `attachSequelizeLens` captures the request id in-context inside the `beforeQuery` hook and carries it to `afterQuery`, guaranteeing correlation. The legacy `logging: (sql, timing) => watcherEmitter.emit("sequelizeQuery", { sql, timing })` wiring still works but cannot correlate.

### 4. MikroORM

Capture queries from **MikroORM** by using `createMikroOrmHandler` and `MikroOrmLensLogger`.

**Dependencies:**

```bash
npm install @mikro-orm/core
```

**Usage Example (Fastify + MikroORM):**

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import { MikroORM } from "@mikro-orm/core";
import { createMikroOrmHandler, attachMikroOrmLens } from "@lensjs/watchers";

const app = Fastify();

// Step 1: Initialize MikroORM
const orm = await MikroORM.init({
  // ... your MikroORM options
});

// Step 2: Attach Lens — captures the request id in-context from the underlying
// knex driver so queries correlate to the request that issued them.
attachMikroOrmLens(orm);

// Step 3: Register the query watcher with lens
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createMikroOrmHandler({ provider: "postgresql" }),
  },
});
```

> **Why `attachMikroOrmLens`?** MikroORM's logger fires from the driver's detached completion context, so it can't be attached to the originating request. `attachMikroOrmLens` hooks the underlying knex `query` event (SQL drivers) to capture the request id in-context and links it to the result via knex's per-query id. Transaction queries are filtered out automatically. `MikroOrmLensLogger` remains available (via `loggerFactory` with `debug: true`) for console-style capture without correlation — use one or the other, not both.

## Custom Handlers

If your ORM or query client is not supported by the built-in handlers, you can create your own custom handler to integrate with Lens.

### Handler Essentials

A custom handler must adhere to the `QueryWatcherHandler` interface and perform the following:

*   Return a `QueryWatcherHandler` function.
*   Call the `onQuery` callback function whenever a query is captured, providing the necessary query details.
*   Query log/event callbacks from most drivers fire from a **detached context** (a native boundary, connection pool, worker, or external emitter) where the async context is already lost. Capture the request id at an **in-context** hook (ORM plugin/hook that runs at query-issue time) with `getCurrentRequestId()` from `@lensjs/core` and pass it as the second argument: `onQuery(entry, requestId)`. The built-in integrations do this for you via `withLensPrisma`, `attachSequelizeLens`, `createLensKyselyPlugin`, and `attachMikroOrmLens`.
*   Optionally utilize `lensUtils` for common tasks:
    *   `interpolateQuery(sql, params)`: Injects parameters into a SQL query string.
    *   `formatSqlQuery(query)`: Formats a SQL query for better readability.
    *   `now()`: Generates a timestamp.

### Example: Custom Kysely Handler

This example demonstrates how to create a custom handler for Kysely, manually emitting query events:

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";
import { type QueryWatcherHandler } from "@lensjs/watchers";
import { lensUtils } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import Emittery from "emittery";

const app = Fastify();
const eventEmitter = new Emittery();

interface Database {
  users: { name: string };
}

const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    }),
  }),
  log: (event) => {
    eventEmitter.emit("customQuery", event); // Emit custom query events
  },
});

function customQueryHandler(): QueryWatcherHandler {
  return async ({ onQuery }) => {
    const databaseType = "mysql";

    eventEmitter.on("customQuery", (payload) => {
      onQuery({
        query: lensUtils.formatSqlQuery(
          lensUtils.interpolateQuery(
            payload.query.sql,
            payload.query.parameters as any[],
          ),
          databaseType,
        ),
        duration: `${payload.queryDurationMillis ?? 0} ms`,
        type: databaseType,
        createdAt: nowISO(),
      });
    });
  };
}

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: customQueryHandler(),
  },
});
```

## Summary

- Use **built-in handlers** for Prisma, Kysely, Sequelize, and MikroORM  
- Or build a **custom handler** for your ORM/client  
- All queries are automatically captured and displayed in the **Lens UI**