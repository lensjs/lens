---
"@lensjs/core": major
---

Replace offset pagination with cursor pagination for the list endpoints, and switch the dashboard to infinite scroll.

- `Store.paginate(type, { cursor?, perPage }, includeFullData?)` now pages by an opaque cursor (the SQLite `rowid`, i.e. insertion order, newest-first) instead of `page`/offset. It fetches `perPage + 1` rows to detect whether more results exist, avoiding a `COUNT(*)` on every list request — much faster on large datasets.
- `Paginator` / `PaginationParams` and the list API response `meta` changed from `{ total, lastPage, currentPage }` to `{ nextCursor, hasMore, perPage }`. List endpoints now accept `?cursor=<id>&perPage=<n>` instead of `?page=<n>`.
- The dashboard loads lists via infinite scroll (an `IntersectionObserver` sentinel that pre-fetches before the bottom) instead of a "Load more" button.
- The Telescope-style live feed now uses **delta polling**: list endpoints accept `?after=<id>` and the meta exposes a `headCursor`, so each poll transfers only entries newer than the newest one already seen (instead of re-fetching the whole head page). When more entries arrive between polls than a single page can return, the response flags a gap (`hasMore`) and the dashboard surfaces a "high write volume — some entries omitted" notice — a natural sampling valve under load.

BREAKING: custom `Store` implementations and any direct consumers of the list API response shape must migrate from page/offset to cursor pagination.
