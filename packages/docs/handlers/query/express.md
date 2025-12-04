# Express Query Watcher Handlers

Lens provides built-in handlers to monitor database queries from popular ORMs within your Express application. This guide covers how to integrate these handlers and also how to create custom ones.

## Prerequisites

Before using the built-in query watcher handlers, ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

This package supports popular ORMs out of the box, allowing you to easily plug them into the Lens ecosystem.

## Built-in Handlers

### 1. Prisma

Capture queries from **Prisma** by using `createPrismaHandler`.

**Prerequisites:**
Follow the official Prisma documentation to install Prisma in your project and then [Install Prisma Client](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/install-prisma-client-typescript-planetscale).

**Usage Example (Express + Prisma):**

```ts
import express from "express";
import { lens } from "@lensjs/express";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient({ log: ["query"] }); // Enable query logging for Prisma

await lens({
  app,
  queryWatcher: {
    enabled: true, // Enable the query watcher
    handler: createPrismaHandler({
      prisma,
      provider: "mysql", // Specify your database provider
    }),
  },
});
```

### 2. Kysely

Capture queries from **Kysely** by using `createKyselyHandler`.

**Dependencies:**

```bash
npm install kysely mysql2
```

**Usage Example (Express + Kysely):**

```ts
import express from "express";
import { lens } from "@lensjs/express";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { createKyselyHandler, watcherEmitter } from "@lensjs/watchers";

const app = express();

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
  log(event) {
    watcherEmitter.emit("kyselyQuery", event); // Emit Kysely query events to Lens
  },
});
```

### 3. Sequelize

Capture queries from **Sequelize** by using `createSequelizeHandler`.

**Dependencies:**

```bash
npm install sequelize
```

**Usage Example (Express + Sequelize):**

```ts
import express from "express";
import { lens } from "@lensjs/express";
import { Sequelize } from "sequelize";
import { createSequelizeHandler, watcherEmitter } from "@lensjs/watchers";

const app = express();

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
  logging: (sql: string, timing?: number) => {
    watcherEmitter.emit("sequelizeQuery", { sql, timing }); // Emit Sequelize query events to Lens
  },
});
```

## Custom Handlers

If your ORM or query client is not supported by the built-in handlers, you can create your own custom handler to integrate with Lens.

### Handler Essentials

A custom handler must adhere to the `QueryWatcherHandler` interface and perform the following:

*   Return a `QueryWatcherHandler` function.
*   Call the `onQuery` callback function whenever a query is captured, providing the necessary query details.
*   Optionally utilize `lensUtils` for common tasks:
    *   `interpolateQuery(sql, params)`: Injects parameters into a SQL query string.
    *   `formatSqlQuery(query)`: Formats a SQL query for better readability.
    *   `now()`: Generates a timestamp.

### Example: Custom Kysely Handler

This example demonstrates how to create a custom handler for Kysely, manually emitting query events:

```ts
import express from "express";
import { lens } from "@lensjs/express";
import { type QueryWatcherHandler } from "@lensjs/watchers";
import { lensUtils } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import Emittery from "emittery";

const app = express();
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

- Use **built-in handlers** for Prisma, Kysely, and Sequelize  
- Or build a **custom handler** for your ORM/client  
- All queries are automatically captured and displayed in the **Lens UI**