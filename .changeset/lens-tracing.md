---
"@lensjs/core": minor
"@lensjs/express": minor
"@lensjs/watchers": minor
---

Add W3C trace context support so Lens can participate in distributed traces.

- New core tracing primitives (`setLensTraceSink`, `createTraceContext`, `getActiveTraceparent`, `flushTrace`, `parseTraceparent`/`buildTraceparent`, `generateTraceId`/`generateSpanId`) and a `trace` field on the request context that collects the request's correlated entries. Everything is opt-in: with no sink registered there is zero overhead on the request path.
- Incoming `traceparent` headers are honored on Express, Hono, and Next.js — the request joins the caller's trace instead of starting a new one — and the completed trace is flushed to the registered sink after the response.
- `instrumentFetch()` injects a `traceparent` into outgoing calls (never overwriting one the caller set), so downstream services continue the same trace.
- Consumed by the new `@lensjs/otel` package to export OTLP spans.
