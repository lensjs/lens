---
"@lensjs/core": minor
---

Add a metrics/analytics Overview dashboard as the new home page.

- New `createLensMetrics(store)` (exported from `@lensjs/core`) computes an overview for a time window: throughput over time, 5xx/4xx error rate, p50/p95/p99 latency, slowest endpoints (grouped by method+path), slowest queries, and top exceptions (grouped by name+message).
- New `GET /api/metrics?from=&to=` endpoint (added to `uiConfig.api.metrics`); adapters need no changes.
- New dashboard Overview page with dependency-free SVG charts (stat cards, area chart, ranked bar lists), a date-range picker, and drill-down links into the filtered lists. Overview is now the default landing route.
- Latency is derived from the stored duration strings via a new `parseDurationMs` utility; aggregation runs over the window's entries.
