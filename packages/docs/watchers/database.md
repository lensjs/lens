---
outline: deep
---

# Database Queries

<p class="lens-lead">
Capture every database query your application runs — with the SQL, parameters, duration, and the
request that issued it. Lens ships built-in handlers for the popular ORMs and lets you write your
own for anything else.
</p>

<Callout type="info" title="Prerequisite">
Install the watchers package, which bundles the built-in ORM handlers:
</Callout>

<CommandCopy pkg="@lensjs/watchers" />

<Callout type="best-practice" title="The wiring is the same on every framework">
The handler and its "attach"/plugin helper are framework-agnostic — only the surrounding
<code>lens({ app })</code> call differs per adapter. The examples below use Express; swap in your
adapter's <code>lens(...)</code> and everything else is identical. NestJS notes are called out where
dependency injection changes the wiring, and AdonisJS (Lucid) has its own section below.
</Callout>

## Choose your ORM

<CodeTabs :tabs="['Prisma', 'Kysely', 'Sequelize', 'MikroORM', 'Drizzle', 'Mongoose']">
<template #Prisma>

Wrap your client with `withLensPrisma` and register `createPrismaHandler`.

```ts
import { lens } from "@lensjs/express";
import { withLensPrisma, createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

// Wrap the client so every query is captured inside the request context.
// Use this `prisma` instance everywhere you access the database.
export const prisma = withLensPrisma(new PrismaClient(), { provider: "mysql" });

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ provider: "mysql" }),
  },
});
```

<Callout type="best-practice" title="Why withLensPrisma?">
Prisma's query engine emits <code>$on("query")</code> events across a native boundary that loses
Node's async context, so raw-SQL events can't be reliably attached to the request that triggered
them. <code>withLensPrisma</code> captures the request id <strong>at query-issue time</strong> via a
Prisma Client extension, guaranteeing correlation even under concurrency. The legacy
<code>createPrismaHandler({ prisma, provider })</code> form still works (raw SQL via <code>$on</code>)
but <strong>cannot correlate</strong> queries to requests — prefer the wrapper.
</Callout>

**In NestJS**, expose the wrapped client through a factory provider (its type differs from
`PrismaClient`) and inject it where you query:

```ts
// prisma.ts
export const createLensPrismaClient = () =>
  withLensPrisma(new PrismaClient(), { provider: "sqlite" });
export type LensPrismaClient = ReturnType<typeof createLensPrismaClient>;
```

Register `createPrismaHandler({ provider })` in `lens(...)` exactly as above.

</template>
<template #Kysely>

Register `createKyselyHandler` and add `createLensKyselyPlugin` to your Kysely instance.

```bash
npm install kysely mysql2
```

```ts
import { lens } from "@lensjs/express";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import {
  createKyselyHandler,
  createLensKyselyPlugin,
  watcherEmitter,
} from "@lensjs/watchers";

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createKyselyHandler({
      provider: "mysql",
      logQueryErrorsToConsole: true, // Optional (default true)
    }),
  },
});

const db = new Kysely<Database>({
  dialect: new MysqlDialect({ pool: mysql.createPool({ /* ... */ }) }),
  // Captures the request id in-context at compile time.
  plugins: [createLensKyselyPlugin()],
  log(event) {
    watcherEmitter.emit("kyselyQuery", event);
  },
});
```

<Callout type="best-practice" title="Why createLensKyselyPlugin?">
Kysely's <code>log</code> callback fires from the driver's detached completion context, so it can't
see the request that issued the query. The plugin captures the request id in-context when the query
is compiled and links it to the log event via Kysely's <code>queryId</code>. Without it, queries are
recorded but not correlated.
</Callout>

**In NestJS**, add the plugin and `log` emitter to your Kysely module (e.g. `nestjs-kysely`) config;
register `createKyselyHandler` in `lens(...)`.

</template>
<template #Sequelize>

Register `createSequelizeHandler` and call `attachSequelizeLens(sequelize)`.

```bash
npm install sequelize
```

```ts
import { lens } from "@lensjs/express";
import { Sequelize } from "sequelize";
import { createSequelizeHandler, attachSequelizeLens } from "@lensjs/watchers";

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

<Callout type="best-practice" title="Why attachSequelizeLens?">
Sequelize's <code>logging</code> callback fires from the driver's detached completion context, so it
can't be attached to the originating request. <code>attachSequelizeLens</code> captures the request
id in-context inside the <code>beforeQuery</code> hook and carries it to <code>afterQuery</code>,
guaranteeing correlation. Requires <code>benchmark: true</code> and
<code>logQueryParameters: true</code>.
</Callout>

**In NestJS** (`sequelize-typescript`), call `attachSequelizeLens(sequelize)` inside your
`SEQUELIZE` provider factory before returning it.

</template>
<template #MikroORM>

Register `createMikroOrmHandler` and call `attachMikroOrmLens(orm)`.

```bash
npm install @mikro-orm/core
```

```ts
import { lens } from "@lensjs/express";
import { MikroORM } from "@mikro-orm/core";
import { createMikroOrmHandler, attachMikroOrmLens } from "@lensjs/watchers";

const orm = await MikroORM.init({ /* your options */ });

// Captures the request id in-context from the underlying knex driver.
attachMikroOrmLens(orm);

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createMikroOrmHandler({ provider: "postgresql" }),
  },
});
```

<Callout type="best-practice" title="Why attachMikroOrmLens?">
MikroORM's logger fires from the driver's detached completion context. <code>attachMikroOrmLens</code>
hooks the underlying knex <code>query</code> event (SQL drivers) to capture the request id
in-context and links it to the result via knex's per-query id. Transaction queries
(<code>BEGIN</code>, <code>COMMIT</code>, <code>ROLLBACK</code>, <code>SAVEPOINT</code>) are filtered
out automatically. As an alternative without correlation, <code>MikroOrmLensLogger</code> is
available as a <code>loggerFactory</code> — use one or the other, not both.
</Callout>

**In NestJS**, call `attachMikroOrmLens(app.get(MikroORM))` after creating the app, then register
`createMikroOrmHandler({ provider })`.

</template>
<template #Drizzle>

Pass the Lens logger to `drizzle(...)` and register `createDrizzleHandler`.

```bash
npm install drizzle-orm
```

```ts
import { lens } from "@lensjs/express";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createDrizzleHandler, createLensDrizzleLogger } from "@lensjs/watchers";

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

<Callout type="best-practice" title="Why createLensDrizzleLogger?">
Drizzle calls its <code>Logger.logQuery</code> synchronously at query-issue time, so Lens captures
the request id in-context there. Drizzle's logger interface doesn't expose a duration, so queries
are recorded with a <code>0 ms</code> duration.
</Callout>

</template>
<template #Mongoose>

Call `attachMongooseLens(mongoose)` and register `createMongooseHandler`.

```bash
npm install mongoose
```

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

Operations are recorded as `collection.method(args)` with the `mongodb` provider.

<Callout type="best-practice" title="Why attachMongooseLens?">
It enables Mongoose's <code>debug</code> hook, which fires in-context at query-issue time, so Lens
captures the request id correctly. The hook doesn't expose a duration, so operations are recorded
with a <code>0 ms</code> duration.
</Callout>

</template>
</CodeTabs>

## AdonisJS (Lucid)

AdonisJS is different: Lucid emits its own query events, so there's no handler to register — just
enable `debug` on the connection in `config/database.ts`.

```ts
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'sqlite',
  connections: {
    sqlite: {
      debug: true, // [!code ++] // enables query capture for Lens
      client: 'better-sqlite3',
      connection: { filename: app.tmpPath('db.sqlite3') },
    },
  },
})

export default dbConfig
```

With `debug: true`, Lucid emits events that Lens captures automatically in the request context.

## Custom handlers

If your ORM or client isn't supported out of the box, write your own handler.

<Callout type="best-practice" title="Handler essentials">
Implement the <code>QueryWatcherHandler</code> interface: return a handler function and call
<code>onQuery</code> whenever a query is captured. Driver callbacks usually fire from a
<strong>detached context</strong>, so capture the request id at an <strong>in-context</strong> hook
with <code>getCurrentRequestId()</code> from <code>@lensjs/core</code> and pass it as the second
argument: <code>onQuery(entry, requestId)</code>. Reuse <code>lensUtils</code> for
<code>interpolateQuery(sql, params)</code> and <code>formatSqlQuery(query)</code>, and
<code>nowISO()</code> from <code>@lensjs/date</code> for timestamps.
</Callout>

```ts
import { type QueryWatcherHandler } from "@lensjs/watchers";
import { lensUtils } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import Emittery from "emittery";

const eventEmitter = new Emittery();

function customQueryHandler(): QueryWatcherHandler {
  return async ({ onQuery }) => {
    const databaseType = "mysql";

    eventEmitter.on("customQuery", (payload) => {
      onQuery({
        query: lensUtils.formatSqlQuery(
          lensUtils.interpolateQuery(payload.query.sql, payload.query.parameters as any[]),
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
  queryWatcher: { enabled: true, handler: customQueryHandler() },
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="activity" title="Requests" href="/watchers/requests">
    See how queries correlate to the request that ran them.
  </Card>
  <Card icon="settings" title="Configuration" href="/configuration">
    All query-watcher and store options in one place.
  </Card>
</CardGrid>
