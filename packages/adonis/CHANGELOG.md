# @lensjs/adonis

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
