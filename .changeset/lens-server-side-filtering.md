---
"@lensjs/core": minor
---

Move dashboard list filtering, search, date-range, and sort to the server so they apply across the whole dataset instead of only the loaded page.

- `PaginationParams` gains optional `q`, `from`, `to`, `filters` (field + operator), `sort`, `dir`, and `numericSort`; the default `BetterSqliteStore` applies them as bound `WHERE`/`ORDER BY` clauses (injection-safe, field names sanitized).
- The default newest-first view keeps cursor pagination + live tail; any explicit sort switches that view to offset ordering and pauses the live feed.
- The list API endpoints parse these from the query string (`?q=&from=&to=&sort=&dir=` plus `field` / `field__op` filters); adapters need no changes since they already forward the query string.
- The dashboard toolbar adds a date-range picker and a clear-filters action, and search is debounced. All controls are URL-synced and deep-linkable.
