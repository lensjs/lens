---
"@lensjs/core": patch
---

Decode JSON string payloads in the dashboard JSON viewer. Request/response bodies
and headers captured as JSON strings are now parsed and shown as a real tree
instead of an escaped string literal (e.g. `"{\"ok\":true}"`); genuine plain-text
bodies render raw without added quotes/escaping.
