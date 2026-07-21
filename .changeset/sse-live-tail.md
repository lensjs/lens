---
"@lensjs/core": minor
"@lensjs/express": minor
---

Add an opt-in real-time **Live Tail** dashboard view backed by Server-Sent Events, with automatic polling fallback.

- `@lensjs/core` exposes a single in-process `lensStream` that emits every persisted entry (with a monotonic row cursor), a `Store.latest()` query for the newest entries across all watcher types (cursor/delta paginated), and a `GET /{path}/api/stream/poll` endpoint (the all-types delta feed) available on every adapter. `uiConfig.api` gains `stream` and `streamPoll`.
- `@lensjs/express` serves `GET /{path}/api/stream` as SSE: fed by `lensStream` with coalescing (throttled flush + a bounded buffer that raises a `gap` event under overload), heartbeats, `Last-Event-ID`/`?after=` backfill on reconnect, and `?token=` auth (the browser `EventSource` API cannot send an `Authorization` header).
- The dashboard adds a **Live Tail** view (all watcher types, filterable, click-through to details). It seeds with the newest entries, streams via `EventSource`, and transparently falls back to delta polling when SSE is unavailable — both paths advance the same cursor, so no entries are lost or duplicated. Respects the global pause toggle.

SSE is Express-only for now; other adapters use the polling fallback (which is fully functional).
