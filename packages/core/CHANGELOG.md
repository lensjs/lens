# @lensjs/core

## 3.1.0

### Minor Changes

- 39d9f80: Validate Lens configuration at boot with a single, aggregated, actionable error.
  - New `assertValidConfig` (exported from `@lensjs/core`) checks the neutral `LensConfig` surface (`path`, `hiddenParams`, `storeQueueConfig`, `sampling`, `retention`, `alerts`) and throws one error listing every problem it finds.
  - Each adapter runs it as it starts, so misconfigurations fail fast with a clear message instead of surfacing later.

- 39d9f80: Dashboard: query issue flags, export, and live exception toasts.
  - Flag **slow**, **duplicate**, and **N+1** queries — a slow badge on the query lists, and duplicate/N+1 badges on the request timeline (detected per request, client-side over the request's full query set).
  - **Export** the loaded, filtered rows of any list as JSON or CSV from the toolbar, and export a single request as **HAR** from its detail page.
  - **Exception toasts** — new exceptions surface as toasts via the live SSE stream, deduped by fingerprint, respecting the recording-pause toggle, and deep-linking to the exception.

- 3e5244b: Add exception fingerprinting/grouping and config-driven outbound alerting.
  - Every exception now gets a stable `fingerprint` (from its type + originating file/function, with a normalized-message fallback) stored in `minimal_data`, so repeat errors collapse into one issue. The dashboard Exceptions page gains a "Group by issue" toggle (count + last seen) that drill-downs to a single issue's occurrences via the server-side `fingerprint` filter, backed by a new `GET /api/exceptions/groups` endpoint.
  - New `alerts` config posts to Slack, Discord, or a generic webhook when a new exception issue is captured — deduped by fingerprint within a cooldown and delivered non-blocking (never throws into the app). Exposed as `createLensNotifier` from `@lensjs/core`; adapters forward the `alerts` option to core.

- 4ba5a0c: Add a Jobs / Queue watcher that captures background jobs (BullMQ, Agenda) as one live-updating row per job.
  - New `job` signal in `@lensjs/core`: `JobWatcher`, `JobEntry`, `WatcherTypeEnum.JOB`, `/api/jobs` endpoints, reader correlation, and a dashboard Jobs view (status badge, queue, attempts, duration, data/result) that also appears in Live Tail and the request timeline.
  - The store `save` now upserts by `id` (`INSERT OR REPLACE`) and the dashboard live feed replaces rows by id, so a job's status updates in place (active -> completed/failed) in real time. Unique-id signals are unaffected.
  - New driver integrations in `@lensjs/watchers`: `attachBullmqLens(worker)`, `attachAgendaLens(agenda)`, and `emitLensJob()` for custom queues. `bullmq` and `agenda` are optional peer dependencies.
  - Enable per adapter with `jobWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.job: true` (AdonisJS).

- 4ba5a0c: Add a Logs watcher that captures application log output and correlates it to the request that produced it.
  - New `log` signal in `@lensjs/core`: `LogWatcher`, `LogEntry`, the `WatcherTypeEnum.LOG` member, the `/api/logs` endpoints, reader correlation, and a dedicated dashboard view (level badge, message, context) that also shows up in Live Tail and the request timeline.
  - New driver integrations in `@lensjs/watchers`: `patchConsole()`, `createLensPinoStream()`, `createLensWinstonTransport()`, and `emitLensLog()` for custom loggers. `pino` and `winston` are optional peer dependencies.
  - Enable it per adapter via `logWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.log: true` (AdonisJS). Log context is redacted (password/secret/token/authorization/apiKey…) and size-capped before storage.

- 68f0f5d: Add a public read facade and a configurable SQLite store so external, read-only consumers can read captured data:
  - `createLensReader(store)` (+ `LensReader`, `ReaderWindow` and `RequestTimeline` types) — the read/correlation surface the `ApiController` now delegates to. It covers listing any signal type with the dashboard's server-side search/filter/sort/date-range options, request timelines, the aggregated overview, and fingerprint-grouped exception issues.
  - `QueuedStoreConfig.databasePath` and `QueuedStoreConfig.readonly`, plus a `BetterSqliteStore` constructor, so the store can open an arbitrary database file read-only (schema/WAL setup is skipped in read-only mode).

  All changes are additive and backward compatible.

- ad56591: Add a metrics/analytics Overview dashboard as the new home page.
  - New `createLensMetrics(store)` (exported from `@lensjs/core`) computes an overview for a time window: throughput over time, 5xx/4xx error rate, p50/p95/p99 latency, slowest endpoints (grouped by method+path), slowest queries, and top exceptions (grouped by name+message).
  - New `GET /api/metrics?from=&to=` endpoint (added to `uiConfig.api.metrics`); adapters need no changes.
  - New dashboard Overview page with dependency-free SVG charts (stat cards, area chart, ranked bar lists), a date-range picker, and drill-down links into the filtered lists. Overview is now the default landing route.
  - Latency is derived from the stored duration strings via a new `parseDurationMs` utility; aggregation runs over the window's entries.

- 14dab1b: Add age-based retention policies that purge entries older than a max age, per signal type.
  - New `storeQueueConfig.retention` (`{ defaultMaxAgeMs, perType, sweepIntervalMs }`); a `RetentionStore` mixin sweeps on an interval for both the SQLite and SQL stores, complementing the existing size-based pruning.
  - Adds `Store.pruneOlderThan(cutoffISO, type?)` (a default no-op, implemented by the built-in stores) — additive, so custom stores keep working.

- 39d9f80: Add request/trace sampling with error- and slow-biased always-on rules.
  - New `sampling` config (`{ rate, alwaysOnErrors, alwaysOnSlowMs }`). Sampled-out requests buffer their entries and are only written if they error (5xx) or exceed the slow threshold — so a kept request keeps its correlated queries/logs too. Exceptions are always captured.
  - Applied on Express, Hono, and Next.js (where the request context wraps the full request lifecycle). Exposed via `createSamplingState` / `finalizeSampling`; watchers now persist through a sampling-aware choke point.

- a32f0e2: Move dashboard list filtering, search, date-range, and sort to the server so they apply across the whole dataset instead of only the loaded page.
  - `PaginationParams` gains optional `q`, `from`, `to`, `filters` (field + operator), `sort`, `dir`, and `numericSort`; the default `BetterSqliteStore` applies them as bound `WHERE`/`ORDER BY` clauses (injection-safe, field names sanitized).
  - The default newest-first view keeps cursor pagination + live tail; any explicit sort switches that view to offset ordering and pauses the live feed.
  - The list API endpoints parse these from the query string (`?q=&from=&to=&sort=&dir=` plus `field` / `field__op` filters); adapters need no changes since they already forward the query string.
  - The dashboard toolbar adds a date-range picker and a clear-filters action, and search is debounced. All controls are URL-synced and deep-linkable.

- 14dab1b: Add a production-ready PostgreSQL / MySQL storage backend alongside the default SQLite store, for shared, multi-instance deployments.
  - New `QueuedSqlStore` (and the underlying `SqlStore`) implement the full `Store` contract for both engines from a single dialect-parameterized implementation: cursor + offset pagination, server-side search / date-range / field filtering, real-time job upserts (fresh `seq` cursor), and size-based pruning.
  - Inject it with `Lens.setStore(new QueuedSqlStore({ dialect: "postgres" | "mysql", connectionString }))` before starting your adapter; works unchanged across Express, Fastify, NestJS, and AdonisJS. You can also pass an existing `pool`.
  - `pg` and `mysql2` are optional peer dependencies, imported dynamically only when the matching dialect is used, so SQLite users are unaffected.
  - Exposes `SqlStore`, `QueuedSqlStore`, and the `SqlStoreConfig` / `SqlDialect` types from the package barrel.

- baaf802: Add W3C trace context support so Lens can participate in distributed traces.
  - New core tracing primitives (`setLensTraceSink`, `createTraceContext`, `getActiveTraceparent`, `flushTrace`, `parseTraceparent`/`buildTraceparent`, `generateTraceId`/`generateSpanId`) and a `trace` field on the request context that collects the request's correlated entries. Everything is opt-in: with no sink registered there is zero overhead on the request path.
  - Incoming `traceparent` headers are honored on Express, Hono, and Next.js — the request joins the caller's trace instead of starting a new one — and the completed trace is flushed to the registered sink after the response.
  - `instrumentFetch()` injects a `traceparent` into outgoing calls (never overwriting one the caller set), so downstream services continue the same trace.
  - Consumed by the new `@lensjs/otel` package to export OTLP spans.

## 3.0.0

### Major Changes

- c99b23f: Replace offset pagination with cursor pagination for the list endpoints, and switch the dashboard to infinite scroll.
  - `Store.paginate(type, { cursor?, perPage }, includeFullData?)` now pages by an opaque cursor (the SQLite `rowid`, i.e. insertion order, newest-first) instead of `page`/offset. It fetches `perPage + 1` rows to detect whether more results exist, avoiding a `COUNT(*)` on every list request — much faster on large datasets.
  - `Paginator` / `PaginationParams` and the list API response `meta` changed from `{ total, lastPage, currentPage }` to `{ nextCursor, hasMore, perPage }`. List endpoints now accept `?cursor=<id>&perPage=<n>` instead of `?page=<n>`.
  - The dashboard loads lists via infinite scroll (an `IntersectionObserver` sentinel that pre-fetches before the bottom) instead of a "Load more" button.
  - The Telescope-style live feed now uses **delta polling**: list endpoints accept `?after=<id>` and the meta exposes a `headCursor`, so each poll transfers only entries newer than the newest one already seen (instead of re-fetching the whole head page). When more entries arrive between polls than a single page can return, the response flags a gap (`hasMore`) and the dashboard surfaces a "high write volume — some entries omitted" notice — a natural sampling valve under load.

  BREAKING: custom `Store` implementations and any direct consumers of the list API response shape must migrate from page/offset to cursor pagination.

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

- c99b23f: Guarantee request correlation for database queries across every driver.

  Previously, queries were correlated by reading the async context at the moment the driver's log/event fired. That only works when the event is emitted inside the request scope — it silently failed for drivers whose events cross a detached boundary (most notably Prisma's query engine), so those queries were never attached to their request.
  - `@lensjs/core` now exports `getCurrentRequestId()` for capturing the active request id inside the async context.
  - The query watcher `onQuery` callback accepts an optional in-context `requestId` (`onQuery(entry, requestId)`); Express and Fastify prefer it and fall back to the async context, so existing custom handlers keep working.
  - New `withLensPrisma(client, { provider })` wraps a `PrismaClient` with a Client Extension that captures the request id at query-issue time and bridges each operation via `watcherEmitter`. `createPrismaHandler({ provider })` consumes it and always attaches the correct request, even under concurrency. Passing a raw client (`createPrismaHandler({ prisma, provider })`) keeps the legacy `$on` path, which shows raw SQL but cannot correlate.
  - Sequelize, Kysely, and MikroORM gain in-context capture helpers, because their driver log/event callbacks fire from a detached context (connection pool / native callback) that loses the request: `attachSequelizeLens(sequelize)` (`beforeQuery`/`afterQuery` hooks), `createLensKyselyPlugin()` (a Kysely plugin linked to the log event via `queryId`), and `attachMikroOrmLens(orm)` (the underlying knex `query` event). They share a single transaction-noise filter (`BEGIN`/`COMMIT`/`ROLLBACK`/`SAVEPOINT`), and query instrumentation is guarded so it can never throw into the query path.
  - NestJS exceptions are now correlated to their originating request.

- c99b23f: Add an opt-in real-time **Live Tail** dashboard view backed by Server-Sent Events, with automatic polling fallback.
  - `@lensjs/core` exposes a single in-process `lensStream` that emits every persisted entry (with a monotonic row cursor), a `Store.latest()` query for the newest entries across all watcher types (cursor/delta paginated), and a `GET /{path}/api/stream/poll` endpoint (the all-types delta feed) available on every adapter. `uiConfig.api` gains `stream` and `streamPoll`.
  - `@lensjs/express` serves `GET /{path}/api/stream` as SSE: fed by `lensStream` with coalescing (throttled flush + a bounded buffer that raises a `gap` event under overload), heartbeats, `Last-Event-ID`/`?after=` backfill on reconnect, and `?token=` auth (the browser `EventSource` API cannot send an `Authorization` header).
  - The dashboard adds a **Live Tail** view (all watcher types, filterable, click-through to details). It seeds with the newest entries, streams via `EventSource`, and transparently falls back to delta polling when SSE is unavailable — both paths advance the same cursor, so no entries are lost or duplicated. Respects the global pause toggle.

  SSE is Express-only for now; other adapters use the polling fallback (which is fully functional).

- c99b23f: Add a live feed with a pause/resume toggle to the dashboard (Telescope-style). List views (requests, queries, cache, exceptions, mail) now poll for newly-captured entries and prepend them automatically. A "Live/Paused" control in the header stops and resumes the live updates; the choice is persisted across reloads. Pausing only affects the UI feed — the server keeps recording.

## 2.6.0

### Minor Changes

- e2263eb: implement mail watcher

## 2.5.0

### Minor Changes

- Add client side search to requests page

## 2.4.0

### Minor Changes

- Add client side search in requests page

## 2.3.2

### Patch Changes

- introduce getRequestIp method and correctly capture client ip behind reverse proxy

## 2.3.1

### Patch Changes

- cd331c0: fix isESM utility

## 2.3.0

### Minor Changes

- e3dbe2d: Hide Sensitive Request Data And change Default Store

## 2.2.2

### Patch Changes

- Improve Request Method Badges Colors

## 2.2.1

### Patch Changes

- Drop Using Emittery

## 2.2.0

### Minor Changes

- Add Fastify And NestJs Adapters

## 2.1.1

### Patch Changes

- fix(ui): json viewer not showing some data types correct

## 2.1.0

### Minor Changes

- 1b97bdd: Add Exception Handling Watcher

## 2.0.0

### Major Changes

- 64887b2: Add Cache Watcher
