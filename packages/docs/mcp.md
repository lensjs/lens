---
outline: deep
---

# MCP Server (AI Agents)

<p class="lens-lead">
<code>@lensjs/mcp</code> exposes everything Lens has captured — requests, queries, logs, jobs,
cache, mail, outbound HTTP, and <strong>exceptions with stack traces and code frames</strong> — to
AI agents over the <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">Model
Context Protocol</a>. Point Cursor, Claude Desktop, or any MCP client at it and the agent can read
your errors, understand the request that caused them, and propose a fix.
</p>

<Callout type="security" title="Read-only and pre-redacted">
Everything is <strong>read-only</strong> and the data is already redacted at capture time — the
agent can see and explain, but never modify your application or its data.
</Callout>

```mermaid
flowchart LR
  agent["AI agent (Cursor / Claude)"]
  stdio["stdio server (lens-mcp)"]
  http["Streamable HTTP handler"]
  db[("lens.db")]
  store["app store"]

  agent -->|"stdio (local)"| stdio
  agent -->|"HTTP (hosted)"| http
  stdio --> db
  http --> store
```

There are two ways to run it: a **standalone stdio server** for local development (the common
case), and a **mountable HTTP handler** for hosted/shared setups.

## Install

<CommandCopy pkg="@lensjs/mcp" />

<Callout type="tip" title="No install needed for stdio">
For the stdio server you don't even need to install it — <code>npx</code> can run it on demand
(see below).
</Callout>

## Use with Cursor / Claude Desktop (stdio)

The stdio server reads your Lens SQLite database directly, so it works whether or not your app is
running. By default Lens writes to `lens.db` in your app's working directory — point the server at
that file with `--db` (or the `LENS_DB_PATH` environment variable).

<CodeTabs :tabs="['Cursor', 'ClaudeDesktop']">
<template #Cursor>

Add the server to your `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "lens": {
      "command": "npx",
      "args": ["-y", "@lensjs/mcp", "--db", "/absolute/path/to/your/app/lens.db"]
    }
  }
}
```

</template>
<template #ClaudeDesktop>

Add the same entry to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lens": {
      "command": "npx",
      "args": ["-y", "@lensjs/mcp", "--db", "/absolute/path/to/your/app/lens.db"]
    }
  }
}
```

</template>
</CodeTabs>

Then ask your agent things like *"What's the most recent exception in Lens and how do I fix it?"*
or run the `diagnose_exception` prompt.

## Tools, prompts & resources

Everything maps onto the same data the dashboard shows.

### Tools

| Tool | Purpose |
| --- | --- |
| `lens_overview` | Aggregated health for a window: throughput, error rate, latency p50/p95/p99, slowest endpoints and queries, top exceptions. Start here. |
| `lens_stats` | How many entries were captured per signal type. |
| `lens_list_issues` | Exceptions grouped into issues by fingerprint, most frequent first, with counts and first/last seen. |
| `lens_list_exceptions` | Individual exceptions; filter by `fingerprint` to see one issue's occurrences. |
| `lens_get_exception` | One exception with its stack trace, code frame, and triggering request. |
| `lens_list_requests` | Requests; filter by `status` / `minStatus` / `method`, or `sortBy: "duration"` for the slowest. |
| `lens_get_request` | One request plus everything correlated to it (queries, cache, exceptions, http, mail, logs, jobs, ...). |
| `lens_list_queries` / `lens_get_query` | Database queries / one query, with `minDurationMs` and duration sorting. |
| `lens_list_slow_queries` | The slowest queries above a threshold, sorted in the database. |
| `lens_list_logs` | Application log lines; filter by `level`. |
| `lens_list_jobs` | Background jobs; filter by `status`, `queue`, or `name`. |
| `lens_list_entries` / `lens_get_entry` | Any remaining signal by type: cache, mail, outbound HTTP, events, redis, FCM. |
| `lens_search` | Substring search across every signal type (or the ones you name). |

<Callout type="performance" title="Filtered in the database">
Every list tool takes <code>search</code>, <code>from</code>, <code>to</code>, <code>limit</code>,
and <code>cursor</code>. Filters, search, and time ranges are applied <strong>in the database over
the whole dataset</strong>, so <code>minStatus: 500</code> finds every failing request, not just
the failures on the first page.
</Callout>

### Prompts

<CardGrid :cols="2">
  <Card icon="bug" title="diagnose_exception">Bundles an exception's message, stack trace, code frame, and triggering request into a ready-to-run prompt asking for root cause, a concrete file/line fix, and prevention.</Card>
  <Card icon="boxes" title="investigate_issue">Takes an issue fingerprint and bundles its frequency, time span, and latest occurrence, asking for the cause behind every occurrence.</Card>
  <Card icon="route" title="debug_request">Bundles a request's timeline (slow queries, exceptions, outbound HTTP) and asks for a diagnosis.</Card>
  <Card icon="trending-up" title="analyze_performance">Bundles the last 24 hours of throughput, latency percentiles, slowest endpoints and queries, and asks for concrete optimizations.</Card>
</CardGrid>

### Resources

- `lens://overview` — the current health snapshot, attachable as context.
- `lens://exception/{id}` and `lens://request/{id}` — reference a specific entry by URI.

## Hosted setup (Streamable HTTP)

For shared/staging/production, mount the HTTP handler inside your running app. It uses your app's
configured store (any backend), so it is not limited to SQLite.

```ts
import express from "express";
import { lens } from "@lensjs/express";
import { createLensMcpHttpHandler } from "@lensjs/mcp";

const app = express();

await lens({
  app,
  // Keep Lens from recording its own MCP endpoint.
  ignoredPaths: [/^\/lens\/mcp/],
});

app.post(
  "/lens/mcp",
  express.json(),
  createLensMcpHttpHandler({
    // Gate access — return false to reject with 401.
    authorize: (authorization) =>
      authorization === `Bearer ${process.env.LENS_MCP_TOKEN}`,
  }),
);
```

<Callout type="warning" title="Protect the HTTP endpoint">
The endpoint exposes captured data, so always require authentication, bind to a trusted network,
and serve it over HTTPS. Add its path to Lens's <code>ignoredPaths</code> so Lens does not record
itself.
</Callout>

## Options

### CLI (stdio)

| Flag / env | Default | Description |
| --- | --- | --- |
| `--db <path>` / `LENS_DB_PATH` | `lens.db` | Path to the Lens SQLite database to read. |

### `createLensMcpHttpHandler(options)`

| Option | Type | Description |
| --- | --- | --- |
| `authorize` | `(authorization?: string) => boolean` | Authorize each request from its `Authorization` header. When omitted, the handler does no auth — only mount it where access is already restricted. |
| `getReader` | `() => LensReader` | Override the data source. Defaults to the running app's store via `getLensStore()`. |
| `name` / `version` | `string` | Server identity reported in the MCP handshake. |

## Security

<CardGrid :cols="3">
  <Card icon="lock" title="Read-only">No tool can mutate captured data or your application.</Card>
  <Card icon="shield-check" title="Already redacted">Headers/body params are hidden and large/binary bodies purged at capture time; the server only reads what Lens stored.</Card>
  <Card icon="terminal" title="stdio stays clean">The stdio server logs only to stderr, keeping the JSON-RPC channel on stdout intact.</Card>
</CardGrid>
