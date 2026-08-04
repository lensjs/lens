# @lensjs/watchers

## 1.4.1

### Patch Changes

- Make optional driver imports lazy so importing `@lensjs/watchers` never requires optional peers to be installed.

  Previously the package barrel statically value-imported `@mikro-orm/core` (`MikroOrmLensLogger extends DefaultLogger`), `winston-transport` (`extends TransportStream`), and `nodemailer/lib/addressparser`. Because those are all optional peer dependencies, any `import … from "@lensjs/watchers"` threw `ERR_MODULE_NOT_FOUND` unless all three were installed — even for consumers that don't use MikroORM, Winston, or the mail watcher. Each is now resolved lazily (only when the relevant factory/handler actually runs).

  Adds `createMikroOrmLensLogger(options)` as the preferred API; `MikroOrmLensLogger` is retained as a backward-compatible, lazily-constructed alias.

## 1.4.0

### Minor Changes

- 60b042c: Add Drizzle and Mongoose query handlers.
  - `createDrizzleHandler({ provider })` + `createLensDrizzleLogger()` capture Drizzle ORM queries in-context (pass the logger to `drizzle(client, { logger })`); `provider` is `"postgresql" | "mysql" | "sqlite"`.
  - `createMongooseHandler()` + `attachMongooseLens(mongoose)` capture MongoDB operations via Mongoose's `debug` hook, recorded with the `mongodb` provider.
  - `drizzle-orm` and `mongoose` are optional peer dependencies. Both hooks fire at query-issue time so queries correlate to the request; neither exposes a duration, so entries are recorded with `0 ms`.

- 4ba5a0c: Add a Jobs / Queue watcher that captures background jobs (BullMQ, Agenda) as one live-updating row per job.
  - New `job` signal in `@lensjs/core`: `JobWatcher`, `JobEntry`, `WatcherTypeEnum.JOB`, `/api/jobs` endpoints, reader correlation, and a dashboard Jobs view (status badge, queue, attempts, duration, data/result) that also appears in Live Tail and the request timeline.
  - The store `save` now upserts by `id` (`INSERT OR REPLACE`) and the dashboard live feed replaces rows by id, so a job's status updates in place (active -> completed/failed) in real time. Unique-id signals are unaffected.
  - New driver integrations in `@lensjs/watchers`: `attachBullmqLens(worker)`, `attachAgendaLens(agenda)`, and `emitLensJob()` for custom queues. `bullmq` and `agenda` are optional peer dependencies.
  - Enable per adapter with `jobWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.job: true` (AdonisJS).

- 4ba5a0c: Add a Logs watcher that captures application log output and correlates it to the request that produced it.
  - New `log` signal in `@lensjs/core`: `LogWatcher`, `LogEntry`, the `WatcherTypeEnum.LOG` member, the `/api/logs` endpoints, reader correlation, and a dedicated dashboard view (level badge, message, context) that also shows up in Live Tail and the request timeline.
  - New driver integrations in `@lensjs/watchers`: `patchConsole()`, `createLensPinoStream()`, `createLensWinstonTransport()`, and `emitLensLog()` for custom loggers. `pino` and `winston` are optional peer dependencies.
  - Enable it per adapter via `logWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.log: true` (AdonisJS). Log context is redacted (password/secret/token/authorization/apiKey…) and size-capped before storage.

- baaf802: Add W3C trace context support so Lens can participate in distributed traces.
  - New core tracing primitives (`setLensTraceSink`, `createTraceContext`, `getActiveTraceparent`, `flushTrace`, `parseTraceparent`/`buildTraceparent`, `generateTraceId`/`generateSpanId`) and a `trace` field on the request context that collects the request's correlated entries. Everything is opt-in: with no sink registered there is zero overhead on the request path.
  - Incoming `traceparent` headers are honored on Express, Hono, and Next.js — the request joins the caller's trace instead of starting a new one — and the completed trace is flushed to the registered sink after the response.
  - `instrumentFetch()` injects a `traceparent` into outgoing calls (never overwriting one the caller set), so downstream services continue the same trace.
  - Consumed by the new `@lensjs/otel` package to export OTLP spans.

### Patch Changes

- Fix mail capture for transports that resolve without an SMTP response line.

  `logNodeMailerEntry` derived the send status from `message.response.split(" ")`, which threw a `TypeError` for transports that don't return a `response` (e.g. Nodemailer's `jsonTransport`, `streamTransport`, or `sendmail`). Because the log call is fire-and-forget, the rejection was swallowed and the message was silently never recorded. Sent mail is now captured for every transport: a missing/non-numeric response is treated as `sent`, and only an explicit non-2xx SMTP code is marked `failed`.

- Updated dependencies [39d9f80]
- Updated dependencies [39d9f80]
- Updated dependencies [3e5244b]
- Updated dependencies [4ba5a0c]
- Updated dependencies [4ba5a0c]
- Updated dependencies [68f0f5d]
- Updated dependencies [ad56591]
- Updated dependencies [14dab1b]
- Updated dependencies [39d9f80]
- Updated dependencies [a32f0e2]
- Updated dependencies [14dab1b]
- Updated dependencies [baaf802]
  - @lensjs/core@3.1.0

## 1.3.0

### Minor Changes

- 8b45034: Add MikroORM query handler and logger support
- c99b23f: Add four new watchers — HTTP client, Events, Redis, and FCM — each captured, correlated to the originating request, and surfaced in the dashboard (dedicated list/detail sections, a tab on the request details page, and the request timeline).
  - **HTTP client watcher**: `instrumentFetch()` (from `@lensjs/watchers`) wraps the global `fetch` to capture outgoing calls (method, URL, status, duration, request/response headers and bodies, and network errors). Sensitive headers are redacted and bodies are size-capped.
  - **Event watcher**: `emitLensEvent(name, payload?)` records application/domain events, and `instrumentEmitter(emitter)` captures every `emit()` on a Node `EventEmitter` (internal `newListener`/`removeListener` events are ignored). Payloads are size-capped.
  - **Redis watcher**: `withLensRedis(client)` instruments an `ioredis` client so every command is captured (command, args, duration, success/failed). `AUTH` arguments are redacted; `ioredis` is an optional peer dependency.
  - **FCM watcher**: `withLensFcm(messaging)` instruments a `firebase-admin` Messaging instance so every push send is captured (`send`, `sendEach`, `sendEachForMulticast`, `sendMulticast`, `sendAll`) with target, notification, message id, and multicast success/failure counts. Device tokens are truncated by default; `firebase-admin` is an optional peer dependency.

  Each watcher is off by default and enabled per adapter: `httpWatcherEnabled`, `eventWatcherEnabled`, `redisWatcherEnabled`, `fcmWatcherEnabled` (Express, Fastify, NestJS) or `watchers.http`, `watchers.event`, `watchers.redis`, `watchers.fcm` (AdonisJS).

- c99b23f: Guarantee request correlation for database queries across every driver.

  Previously, queries were correlated by reading the async context at the moment the driver's log/event fired. That only works when the event is emitted inside the request scope — it silently failed for drivers whose events cross a detached boundary (most notably Prisma's query engine), so those queries were never attached to their request.
  - `@lensjs/core` now exports `getCurrentRequestId()` for capturing the active request id inside the async context.
  - The query watcher `onQuery` callback accepts an optional in-context `requestId` (`onQuery(entry, requestId)`); Express and Fastify prefer it and fall back to the async context, so existing custom handlers keep working.
  - New `withLensPrisma(client, { provider })` wraps a `PrismaClient` with a Client Extension that captures the request id at query-issue time and bridges each operation via `watcherEmitter`. `createPrismaHandler({ provider })` consumes it and always attaches the correct request, even under concurrency. Passing a raw client (`createPrismaHandler({ prisma, provider })`) keeps the legacy `$on` path, which shows raw SQL but cannot correlate.
  - Sequelize, Kysely, and MikroORM gain in-context capture helpers, because their driver log/event callbacks fire from a detached context (connection pool / native callback) that loses the request: `attachSequelizeLens(sequelize)` (`beforeQuery`/`afterQuery` hooks), `createLensKyselyPlugin()` (a Kysely plugin linked to the log event via `queryId`), and `attachMikroOrmLens(orm)` (the underlying knex `query` event). They share a single transaction-noise filter (`BEGIN`/`COMMIT`/`ROLLBACK`/`SAVEPOINT`), and query instrumentation is guarded so it can never throw into the query path.
  - NestJS exceptions are now correlated to their originating request.

### Patch Changes

- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
  - @lensjs/core@3.0.0

## 1.2.0

### Minor Changes

- e2263eb: implement mail watcher

### Patch Changes

- Updated dependencies [e2263eb]
  - @lensjs/core@2.6.0

## 1.1.4

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.5.0

## 1.1.3

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.4.0

## 1.1.2

### Patch Changes

- introduce getRequestIp method and correctly capture client ip behind reverse proxy
- Updated dependencies
  - @lensjs/core@2.3.2

## 1.1.1

### Patch Changes

- Updated dependencies [cd331c0]
  - @lensjs/core@2.3.1

## 1.1.0

### Minor Changes

- e3dbe2d: Hide Sensitive Request Data And change Default Store

### Patch Changes

- Updated dependencies [e3dbe2d]
  - @lensjs/core@2.3.0

## 1.0.18

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.2.2

## 1.0.17

### Patch Changes

- Drop Using Emittery
- Updated dependencies
  - @lensjs/core@2.2.1

## 1.0.16

### Patch Changes

- Add Fastify And NestJs Adapters
- Updated dependencies
  - @lensjs/core@2.2.0

## 1.0.15

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.1.1

## 1.0.14

### Patch Changes

- Updated dependencies [1b97bdd]
  - @lensjs/core@2.1.0

## 1.0.13

### Patch Changes

- Updated dependencies [64887b2]
  - @lensjs/core@2.0.0
