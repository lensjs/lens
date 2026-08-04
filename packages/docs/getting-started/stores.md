# Storage Backends

<p class="lens-lead">
Lens persists everything it captures through a single <strong>Store</strong> contract, so the
dashboard and API never care which database is behind it. By default Lens uses an embedded
<strong>SQLite</strong> file — zero setup, perfect for local development. For production or
multi-instance deployments, switch to <strong>PostgreSQL</strong> or <strong>MySQL</strong> with
one line.
</p>

## Default store (SQLite)

Nothing to configure — Lens writes to a `lens.db` file in your working directory. Tune it through
`storeQueueConfig` on your adapter:

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

Use the `QueuedSqlStore` when you need a shared, production-grade database — for example when
running several instances of your app behind a load balancer, all reporting into one Lens
dashboard.

<Steps>
  <Step title="Install the driver">

The database drivers are **optional peer dependencies**, so you only install the one you use:

::: code-group

```bash [PostgreSQL]
npm install pg
```

```bash [MySQL]
npm install mysql2
```

:::

  </Step>
  <Step title="Inject the store before starting Lens">

Create the store, `initialize()` it (this connects and creates the `lens_entries` table +
indexes), and hand it to `Lens.setStore(...)` **before** you call your adapter's `lens(...)`:

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

  </Step>
</Steps>

<Callout type="success" title="Works with every adapter">
<code>Lens.setStore()</code> works with Express, Fastify, NestJS, and AdonisJS. The store is
engine-agnostic glue that lives in <code>@lensjs/core</code> — every watcher reads and writes
through it, and the dashboard behaves exactly the same.
</Callout>

### Configuration

`QueuedSqlStore` accepts everything `storeQueueConfig` supports (`batchSize`,
`processIntervalMs`, `warnThreshold`, `dbMaxSizeGb`, `dbPruneSizeGb`) plus:

| Option | Type | Description |
| --- | --- | --- |
| `dialect` | `"postgres" \| "mysql"` | **Required.** Which SQL engine to target. |
| `connectionString` | `string` | Driver connection URL. |
| `pool` | `pg.Pool \| mysql2 Pool` | Reuse an existing pool instead of letting Lens create one. |
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

If your app already manages a connection pool, pass it in as `pool` and Lens will use it directly
(it won't create or close a second pool):

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

<CardGrid :cols="2">
  <Card icon="zap" title="Batched, non-blocking writes">
    Like the SQLite store, <code>QueuedSqlStore</code> buffers <code>save()</code> calls and flushes them on an interval, so capturing data never blocks your request path.
  </Card>
  <Card icon="list" title="Cursor + offset pagination">
    List views use an auto-increment <code>seq</code> column for newest-first infinite scroll and live tail; custom column sorts transparently fall back to offset pagination.
  </Card>
  <Card icon="refresh-cw" title="Real-time job updates">
    A job row is upserted as it moves from <code>active</code> to <code>completed</code>/<code>failed</code>, so it updates in place in the dashboard.
  </Card>
  <Card icon="hard-drive" title="Size-based pruning">
    Set <code>dbMaxSizeGb</code> + <code>dbPruneSizeGb</code> to have Lens trim the oldest entries once the table grows past your cap.
  </Card>
</CardGrid>

<Callout type="security" title="Treat the store as sensitive">
Filtering and search target single-level <code>minimal_data</code> fields — the same behavior as
the SQLite store. Point the store at a database you control; Lens captures request/response and
query data, so treat it as sensitive.
</Callout>
