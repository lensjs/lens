---
"@lensjs/hono": minor
---

Add `@lensjs/hono`, a Hono adapter for LensJS.

- Mirrors the Express/Fastify template: a `lens({ app, ... })` factory that wires the request, query, cache, mail, http, event, redis, fcm, log, and job watchers, mounts the core API routes, and serves the bundled dashboard.
- Request capture runs as a single `app.use("*")` middleware on the response lifecycle (non-blocking): it correlates via `lensContext`, redacts headers/body with `hiddenParams`, and purges binary/file response bodies to `"Purged By Lens"`.
- Serves the SSE live tail via `hono/streaming` (`streamSSE`) with backfill, heartbeats, and `?token=` auth, and serves the dashboard's static assets from disk.
- Records exceptions through an auto-registered `app.onError` (toggle with `registerErrorHandler`), preserving Hono's default error responses.
- `hono` is an optional peer dependency; the adapter targets the Node.js runtime (`@hono/node-server`).
