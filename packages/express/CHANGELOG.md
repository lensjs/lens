# @lensjs/express

## 1.6.0

### Minor Changes

- c99b23f: Add an optional password lock for the dashboard. Set `auth.password` in the adapter config to require a password before the dashboard (and its API) can be used.
  - Login issues a short-lived, stateless HMAC token that the dashboard sends as `Authorization: Bearer <token>`; every Lens API route verifies it (the UI shows a login screen and a lock/logout button).
  - Hardened against abuse: per-IP rate limiting with exponential lockout (`429` + `Retry-After`), constant-time password comparison, and generic identical failure responses (nothing to enumerate). Unauthenticated requests are rejected by a cheap token check before any store access.
  - Core exposes `createLensAuth` and a `LensAuthConfig` type; each adapter accepts `auth` (`password`, optional `secret`, `tokenTtl`, `maxAttempts`, `windowMs`, `lockoutMs`). Leaving `auth` unset keeps the dashboard open (no behavior change).

- c99b23f: Add four new watchers — HTTP client, Events, Redis, and FCM — each captured, correlated to the originating request, and surfaced in the dashboard (dedicated list/detail sections, a tab on the request details page, and the request timeline).
  - **HTTP client watcher**: `instrumentFetch()` (from `@lensjs/watchers`) wraps the global `fetch` to capture outgoing calls (method, URL, status, duration, request/response headers and bodies, and network errors). Sensitive headers are redacted and bodies are size-capped.
  - **Event watcher**: `emitLensEvent(name, payload?)` records application/domain events, and `instrumentEmitter(emitter)` captures every `emit()` on a Node `EventEmitter` (internal `newListener`/`removeListener` events are ignored). Payloads are size-capped.
  - **Redis watcher**: `withLensRedis(client)` instruments an `ioredis` client so every command is captured (command, args, duration, success/failed). `AUTH` arguments are redacted; `ioredis` is an optional peer dependency.
  - **FCM watcher**: `withLensFcm(messaging)` instruments a `firebase-admin` Messaging instance so every push send is captured (`send`, `sendEach`, `sendEachForMulticast`, `sendMulticast`, `sendAll`) with target, notification, message id, and multicast success/failure counts. Device tokens are truncated by default; `firebase-admin` is an optional peer dependency.

  Each watcher is off by default and enabled per adapter: `httpWatcherEnabled`, `eventWatcherEnabled`, `redisWatcherEnabled`, `fcmWatcherEnabled` (Express, Fastify, NestJS) or `watchers.http`, `watchers.event`, `watchers.redis`, `watchers.fcm` (AdonisJS).

- c99b23f: Add an opt-in real-time **Live Tail** dashboard view backed by Server-Sent Events, with automatic polling fallback.
  - `@lensjs/core` exposes a single in-process `lensStream` that emits every persisted entry (with a monotonic row cursor), a `Store.latest()` query for the newest entries across all watcher types (cursor/delta paginated), and a `GET /{path}/api/stream/poll` endpoint (the all-types delta feed) available on every adapter. `uiConfig.api` gains `stream` and `streamPoll`.
  - `@lensjs/express` serves `GET /{path}/api/stream` as SSE: fed by `lensStream` with coalescing (throttled flush + a bounded buffer that raises a `gap` event under overload), heartbeats, `Last-Event-ID`/`?after=` backfill on reconnect, and `?token=` auth (the browser `EventSource` API cannot send an `Authorization` header).
  - The dashboard adds a **Live Tail** view (all watcher types, filterable, click-through to details). It seeds with the newest entries, streams via `EventSource`, and transparently falls back to delta polling when SSE is unavailable — both paths advance the same cursor, so no entries are lost or duplicated. Respects the global pause toggle.

  SSE is Express-only for now; other adapters use the polling fallback (which is fully functional).

### Patch Changes

- c99b23f: Guarantee request correlation for database queries across every driver.

  Previously, queries were correlated by reading the async context at the moment the driver's log/event fired. That only works when the event is emitted inside the request scope — it silently failed for drivers whose events cross a detached boundary (most notably Prisma's query engine), so those queries were never attached to their request.
  - `@lensjs/core` now exports `getCurrentRequestId()` for capturing the active request id inside the async context.
  - The query watcher `onQuery` callback accepts an optional in-context `requestId` (`onQuery(entry, requestId)`); Express and Fastify prefer it and fall back to the async context, so existing custom handlers keep working.
  - New `withLensPrisma(client, { provider })` wraps a `PrismaClient` with a Client Extension that captures the request id at query-issue time and bridges each operation via `watcherEmitter`. `createPrismaHandler({ provider })` consumes it and always attaches the correct request, even under concurrency. Passing a raw client (`createPrismaHandler({ prisma, provider })`) keeps the legacy `$on` path, which shows raw SQL but cannot correlate.
  - Sequelize, Kysely, and MikroORM gain in-context capture helpers, because their driver log/event callbacks fire from a detached context (connection pool / native callback) that loses the request: `attachSequelizeLens(sequelize)` (`beforeQuery`/`afterQuery` hooks), `createLensKyselyPlugin()` (a Kysely plugin linked to the log event via `queryId`), and `attachMikroOrmLens(orm)` (the underlying knex `query` event). They share a single transaction-noise filter (`BEGIN`/`COMMIT`/`ROLLBACK`/`SAVEPOINT`), and query instrumentation is guarded so it can never throw into the query path.
  - NestJS exceptions are now correlated to their originating request.

- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [8b45034]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
  - @lensjs/core@3.0.0
  - @lensjs/watchers@1.3.0

## 1.5.0

### Minor Changes

- e2263eb: implement mail watcher

### Patch Changes

- Updated dependencies [e2263eb]
  - @lensjs/core@2.6.0
  - @lensjs/watchers@1.2.0

## 1.4.4

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.5.0
  - @lensjs/watchers@1.1.4

## 1.4.3

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.4.0
  - @lensjs/watchers@1.1.3

## 1.4.2

### Patch Changes

- introduce getRequestIp method and correctly capture client ip behind reverse proxy
- Updated dependencies
  - @lensjs/core@2.3.2
  - @lensjs/watchers@1.1.2

## 1.4.1

### Patch Changes

- Updated dependencies [cd331c0]
  - @lensjs/core@2.3.1
  - @lensjs/watchers@1.1.1

## 1.4.0

### Minor Changes

- e3dbe2d: Hide Sensitive Request Data And change Default Store

### Patch Changes

- Updated dependencies [e3dbe2d]
  - @lensjs/core@2.3.0
  - @lensjs/watchers@1.1.0

## 1.3.3

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.2.2
  - @lensjs/watchers@1.0.18

## 1.3.2

### Patch Changes

- Fix Express Static Server

## 1.3.1

### Patch Changes

- Drop Using Emittery
- Updated dependencies
  - @lensjs/core@2.2.1
  - @lensjs/watchers@1.0.17

## 1.3.0

### Minor Changes

- Add Fastify And NestJs Adapters

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.2.0
  - @lensjs/watchers@1.0.16

## 1.2.1

### Patch Changes

- fix(ui): json viewer not showing some data types correct
- Updated dependencies
  - @lensjs/core@2.1.1
  - @lensjs/watchers@1.0.15

## 1.2.0

### Minor Changes

- 1b97bdd: Add Exception Handling Watcher

### Patch Changes

- Updated dependencies [1b97bdd]
  - @lensjs/core@2.1.0
  - @lensjs/watchers@1.0.14

## 1.1.0

### Minor Changes

- 64887b2: Add Cache Watcher

### Patch Changes

- Updated dependencies [64887b2]
  - @lensjs/core@2.0.0
  - @lensjs/watchers@1.0.13
