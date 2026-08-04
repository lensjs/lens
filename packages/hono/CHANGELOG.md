# @lensjs/hono

## 0.1.1

### Patch Changes

- Updated dependencies
  - @lensjs/watchers@1.4.1

## 0.1.0

### Minor Changes

- f006690: Add `@lensjs/hono`, a Hono adapter for LensJS.
  - Mirrors the Express/Fastify template: a `lens({ app, ... })` factory that wires the request, query, cache, mail, http, event, redis, fcm, log, and job watchers, mounts the core API routes, and serves the bundled dashboard.
  - Request capture runs as a single `app.use("*")` middleware on the response lifecycle (non-blocking): it correlates via `lensContext`, redacts headers/body with `hiddenParams`, and purges binary/file response bodies to `"Purged By Lens"`.
  - Serves the SSE live tail via `hono/streaming` (`streamSSE`) with backfill, heartbeats, and `?token=` auth, and serves the dashboard's static assets from disk.
  - Records exceptions through an auto-registered `app.onError` (toggle with `registerErrorHandler`), preserving Hono's default error responses.
  - `hono` is an optional peer dependency; the adapter targets the Node.js runtime (`@hono/node-server`).

### Patch Changes

- Updated dependencies [39d9f80]
- Updated dependencies [39d9f80]
- Updated dependencies [60b042c]
- Updated dependencies [3e5244b]
- Updated dependencies [4ba5a0c]
- Updated dependencies [4ba5a0c]
- Updated dependencies
- Updated dependencies [68f0f5d]
- Updated dependencies [ad56591]
- Updated dependencies [14dab1b]
- Updated dependencies [39d9f80]
- Updated dependencies [a32f0e2]
- Updated dependencies [14dab1b]
- Updated dependencies [baaf802]
  - @lensjs/core@3.1.0
  - @lensjs/watchers@1.4.0
