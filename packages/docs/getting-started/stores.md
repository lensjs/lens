# Storage Backends

Lens persists everything it captures through a single **Store** contract, so the dashboard and API never care which database is behind it. By default Lens uses an embedded **SQLite** file — zero setup, perfect for local development and single-instance apps. For production or multi-instance deployments you can switch to **PostgreSQL** or **MySQL** with one line.

## Default store (SQLite)

Nothing to configure — Lens writes to a `lens.db` file in your working directory. Tune it through `storeQueueConfig` on your adapter:

```ts
await lens({
  app,
  storeQueueConfig: {
    databasePath: "lens.db", // where the SQLite file lives
    batchSize: 100, // entries flushed per batch
    processIntervalMs: 2000, // how often the write queue drains
    dbMaxSizeGb: 2, // start pruning once the DB grows past this
    dbPruneSizeGb: 0.5, // how much to trim off when pruning
  },
});
```

## PostgreSQL / MySQL

Use the `QueuedSqlStore` when you need a shared, production-grade database — for example when running several instances of your app behind a load balancer, all reporting into one Lens dashboard.

### 1. Install the driver

The database drivers are **optional peer dependencies**, so you only install the one you use:

::: code-group

```bash [PostgreSQL]
npm install pg
```

```bash [MySQL]
npm install mysql2
```

:::

### 2. Inject the store before starting Lens

Create the store, `initialize()` it (this connects and creates the `lens_entries` table + indexes), and hand it to `Lens.setStore(...)` **before** you call your adapter's `lens(...)`:

::: code-group

```ts [PostgreSQL]
import { Lens, QueuedSqlStore } from "@lensjs/core";
import { lens } from "@lensjs/express";

const store = new QueuedSqlStore({
  dialect: "postgres",
  connectionString: process.env.DATABASE_URL, // postgres://user:pass@host:5432/db
});
await store.initialize();
Lens.setStore(store);

await lens({ app });
```

```ts [MySQL]
import { Lens, QueuedSqlStore } from "@lensjs/core";
import { lens } from "@lensjs/express";

const store = new QueuedSqlStore({
  dialect: "mysql",
  connectionString: process.env.DATABASE_URL, // mysql://user:pass@host:3306/db
});
await store.initialize();
Lens.setStore(store);

await lens({ app });
```

:::

That's it — every watcher now reads and writes through Postgres/MySQL, and the dashboard works exactly the same. `Lens.setStore()` works with **every** adapter (Express, Fastify, NestJS, AdonisJS); the store is engine-agnostic glue that lives in `@lensjs/core`.

### Configuration

`QueuedSqlStore` accepts everything `storeQueueConfig` supports (`batchSize`, `processIntervalMs`, `warnThreshold`, `dbMaxSizeGb`, `dbPruneSizeGb`) plus:

| Option | Type | Description |
| --- | --- | --- |
| `dialect` | `"postgres" \| "mysql"` | **Required.** Which SQL engine to target. |
| `connectionString` | `string` | Driver connection URL. |
| `pool` | `pg.Pool \| mysql2 Pool` | Reuse an existing pool instead of letting Lens create one (see below). |
| `tableName` | `string` | Table to store entries in. Defaults to `lens_entries`. |

```ts
const store = new QueuedSqlStore({
  dialect: "postgres",
  connectionString: process.env.DATABASE_URL,
  tableName: "lens_entries",
  batchSize: 200,
  dbMaxSizeGb: 5, // size-based pruning works on Postgres/MySQL too
  dbPruneSizeGb: 1,
});
```

### Bring your own pool

If your app already manages a connection pool, pass it in as `pool` and Lens will use it directly (it won't create or close a second pool):

::: code-group

```ts [PostgreSQL]
import { Pool } from "pg";
import { QueuedSqlStore } from "@lensjs/core";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const store = new QueuedSqlStore({ dialect: "postgres", pool });
await store.initialize();
```

```ts [MySQL]
import { createPool } from "mysql2/promise";
import { QueuedSqlStore } from "@lensjs/core";

const pool = createPool(process.env.DATABASE_URL!);

const store = new QueuedSqlStore({ dialect: "mysql", pool });
await store.initialize();
```

:::

## How it works

- **Batched, non-blocking writes.** Like the SQLite store, `QueuedSqlStore` buffers `save()` calls and flushes them on an interval, so capturing data never blocks your request path.
- **Cursor + offset pagination.** The list views use an auto-increment `seq` column for newest-first infinite scroll and live tail; switching to a custom column sort transparently falls back to offset pagination.
- **Real-time job updates.** A job row is upserted (delete + insert) as it moves from `active` to `completed`/`failed`, so it updates in place in the dashboard.
- **Size-based pruning.** Set `dbMaxSizeGb` + `dbPruneSizeGb` to have Lens trim the oldest entries once the table grows past your cap.

::: tip
Filtering and search target single-level `minimal_data` fields — the same behavior as the SQLite store. Point the store at a database you control; Lens captures request/response and query data, so treat it as sensitive.
:::
