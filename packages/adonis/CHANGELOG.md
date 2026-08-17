# @lensjs/adonis

## 1.5.1

### Patch Changes

- Updated dependencies [a72a324]
- Updated dependencies [a72a324]
- Updated dependencies [a72a324]
  - @lensjs/core@3.2.0

## 1.5.0

### Minor Changes

- 39d9f80: Validate Lens configuration at boot with a single, aggregated, actionable error.
  - New `assertValidConfig` (exported from `@lensjs/core`) checks the neutral `LensConfig` surface (`path`, `hiddenParams`, `storeQueueConfig`, `sampling`, `retention`, `alerts`) and throws one error listing every problem it finds.
  - Each adapter runs it as it starts, so misconfigurations fail fast with a clear message instead of surfacing later.

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

### Patch Changes

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

## 1.4.0

### Minor Changes

- c99b23f: Add mail watcher support to the AdonisJS adapter. When the `mail` watcher is enabled, Lens automatically captures emails sent via `@adonisjs/mail` by listening to the `mail:sent` event and correlates them to the originating request.
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

### Patch Changes

- c99b23f: Fix a boot crash ("Cannot read properties of undefined (reading 'booted')") caused by eagerly importing `@adonisjs/core/services/emitter` at module load. The query watcher now uses the container-resolved emitter instance, so importing `@lensjs/adonis` during the config phase no longer initializes the emitter service too early.
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
- Updated dependencies [c99b23f]
  - @lensjs/core@3.0.0

## 1.3.5

### Patch Changes

- Updated dependencies [e2263eb]
  - @lensjs/core@2.6.0

## 1.3.4

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.5.0

## 1.3.3

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.4.0

## 1.3.2

### Patch Changes

- introduce getRequestIp method and correctly capture client ip behind reverse proxy
- Updated dependencies
  - @lensjs/core@2.3.2

## 1.3.1

### Patch Changes

- Updated dependencies [cd331c0]
  - @lensjs/core@2.3.1

## 1.3.0

### Minor Changes

- e3dbe2d: Hide Sensitive Request Data And change Default Store

### Patch Changes

- Updated dependencies [e3dbe2d]
  - @lensjs/core@2.3.0

## 1.2.4

### Patch Changes

- Updated dependencies
  - @lensjs/core@2.2.2

## 1.2.3

### Patch Changes

- Drop Using Emittery
- Updated dependencies
  - @lensjs/core@2.2.1

## 1.2.2

### Patch Changes

- Add Fastify And NestJs Adapters
- Updated dependencies
  - @lensjs/core@2.2.0

## 1.2.1

### Patch Changes

- fix(ui): json viewer not showing some data types correct
- Updated dependencies
  - @lensjs/core@2.1.1

## 1.2.0

### Minor Changes

- 1b97bdd: Add Exception Handling Watcher

### Patch Changes

- Updated dependencies [1b97bdd]
  - @lensjs/core@2.1.0

## 1.1.0

### Minor Changes

- 64887b2: Add Cache Watcher

### Patch Changes

- Updated dependencies [64887b2]
  - @lensjs/core@2.0.0
