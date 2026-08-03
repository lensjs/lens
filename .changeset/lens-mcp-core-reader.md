---
"@lensjs/core": minor
---

Add a public read facade and a configurable SQLite store so external, read-only consumers can read captured data:

- `createLensReader(store)` (+ `LensReader`, `ReaderWindow` and `RequestTimeline` types) — the read/correlation surface the `ApiController` now delegates to. It covers listing any signal type with the dashboard's server-side search/filter/sort/date-range options, request timelines, the aggregated overview, and fingerprint-grouped exception issues.
- `QueuedStoreConfig.databasePath` and `QueuedStoreConfig.readonly`, plus a `BetterSqliteStore` constructor, so the store can open an arbitrary database file read-only (schema/WAL setup is skipped in read-only mode).

All changes are additive and backward compatible.
