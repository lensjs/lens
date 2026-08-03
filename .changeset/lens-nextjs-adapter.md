---
"@lensjs/nextjs": minor
---

Add `@lensjs/nextjs`, a Next.js App Router adapter for LensJS.

- `createLens(config)` returns `handlers` (GET/POST/DELETE) you re-export from a catch-all `app/<path>/[[...lensjs]]/route.ts` plus an `app/lens-config/route.ts` to serve the dashboard, the Lens API, and the SSE live tail — routes still come from core.
- `withLens(handler)` wraps your own Route Handlers to capture the request/response (redacted + purged) and correlate any queries, logs, and exceptions to that request via `lensContext`.
- Query, cache, mail, http, event, redis, fcm, log, and job watchers work as usual through `lensEmitter`; exceptions in wrapped handlers are recorded and re-thrown.
- Optional Edge-safe `lensMiddleware()` (exported from `@lensjs/nextjs/middleware`) stamps an `x-lens-request-id` header for cross-middleware correlation without importing the Node-only engine.
- `next` is a peer dependency; the dashboard/API run on the Node.js runtime (`export const runtime = "nodejs"`).
