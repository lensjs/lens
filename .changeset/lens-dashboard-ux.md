---
"@lensjs/core": minor
---

Dashboard: query issue flags, export, and live exception toasts.

- Flag **slow**, **duplicate**, and **N+1** queries — a slow badge on the query lists, and duplicate/N+1 badges on the request timeline (detected per request, client-side over the request's full query set).
- **Export** the loaded, filtered rows of any list as JSON or CSV from the toolbar, and export a single request as **HAR** from its detail page.
- **Exception toasts** — new exceptions surface as toasts via the live SSE stream, deduped by fingerprint, respecting the recording-pause toggle, and deep-linking to the exception.
