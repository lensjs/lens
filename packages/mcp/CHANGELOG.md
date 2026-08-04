# @lensjs/mcp

## 0.1.0

### Minor Changes

- 68f0f5d: Add `@lensjs/mcp`, a Model Context Protocol server that gives AI agents read-only access to Lens's captured errors, requests, and queries so they can diagnose issues and propose fixes.
  - Standalone stdio server (`npx @lensjs/mcp --db lens.db`) for Cursor, Claude Desktop, and other MCP clients — reads the SQLite database directly.
  - Mountable Streamable HTTP handler (`createLensMcpHttpHandler`) for hosted setups, working with any configured store via `getLensStore()`.
  - Read-only tools covering every captured signal: an aggregated `lens_overview` (throughput, error rate, latency percentiles, slowest endpoints/queries, top exceptions), fingerprint-grouped issues, requests and their full timelines, queries and slow queries, logs, background jobs, and a generic list/get for cache, mail, outbound HTTP, events, redis, and FCM — plus cross-signal search and capture stats.
  - Search, field filters, and time ranges run in the database over the whole dataset (not just the fetched page), so `minStatus: 500` or `level: "error"` finds every match.
  - `diagnose_exception`, `investigate_issue`, `debug_request`, and `analyze_performance` prompts, plus overview/exception/request resources. All data is already redacted at capture; the server never mutates state.

### Patch Changes

- Updated dependencies [39d9f80]
- Updated dependencies [39d9f80]
- Updated dependencies [3e5244b]
- Updated dependencies [4ba5a0c]
- Updated dependencies [4ba5a0c]
- Updated dependencies [68f0f5d]
- Updated dependencies [ad56591]
- Updated dependencies [14dab1b]
- Updated dependencies [39d9f80]
- Updated dependencies [a32f0e2]
- Updated dependencies [14dab1b]
- Updated dependencies [baaf802]
  - @lensjs/core@3.1.0
