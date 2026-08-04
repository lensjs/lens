---
pageClass: dashboard-tour
aside: false
---

# The Dashboard

<p class="lens-lead">
The Lens dashboard is where captured requests, queries, cache operations, mail, jobs, and
exceptions come to life. This is a tour of every view — the list, and what you see when you open
an entry.
</p>

<Callout type="tip" title="Try it live">
Explore a running dashboard with real, streaming data — no install required — at the
<a href="https://industrial-ella-mohammedelattar-8b6e3b6c.koyeb.app" target="_blank" rel="noreferrer">public live demo</a>.
</Callout>

<BrowserMockup url="localhost:3000/lens">
  <img src="/screenshots/requests.png" alt="The Lens dashboard showing captured HTTP requests" />
</BrowserMockup>

## Navigation

The UI is organized into sections, reachable from the sidebar: **Overview**, **Live Tail**,
**Requests**, **Queries**, **Cache**, **Exceptions**, **Mail**, **HTTP**, **Events**, **Redis**,
**FCM**, **Logs**, and **Jobs**. The header shows your application name (click it to return to the
Overview), a delete action, and — on small screens — a menu toggle for the sidebar.

<Callout type="danger" title="Delete is permanent">
The trash icon opens a confirmation modal that <strong>permanently deletes all recorded
entries</strong> across every category. Use with care.
</Callout>

## Overview

The **Overview** (`/lens/overview`) is a real-time summary over a selectable range (default: last
24 hours): stat cards for throughput, 5xx error rate, and p50/p95/p99 latency; a requests-over-time
chart with errors overlaid; a p95 latency trend; and lists of the slowest endpoints, slowest
queries, and top exceptions.

<ScreenshotFrame
  src="/screenshots/overview.png"
  alt="Overview dashboard: stat cards for throughput, error rate, and latency percentiles, with slowest endpoints."
  caption="The Overview — a real-time analytics summary."
/>

## Live Tail

The **Live Tail** (`/lens/live`) is a unified, real-time feed of every captured entry — requests,
queries, cache, logs, and more — as your app handles traffic. It's the fastest way to watch a flow
end to end while you reproduce a bug.

<ScreenshotFrame
  src="/screenshots/live-tail.png"
  alt="Live Tail: a real-time stream of captured entries across every watcher as they occur."
  caption="Live Tail — every signal, streaming in as it happens."
/>

## Requests

The **Requests list** (`/lens/requests`) is a table with color-coded method and status badges, the
path, duration, and a human-readable time. Use **Load More** to page through older entries.

<ScreenshotFrame
  src="/screenshots/requests.png"
  alt="Requests list: a table of HTTP requests with method, path, status, duration, and timestamp."
  caption="The Requests list — filterable across the entire dataset."
/>

Open a request to see its **detail** page: request/response bodies and headers in tabs, the
resolved user, a chronological **timeline** (with **N+1** and **Duplicate** flags), and every
query, cache op, and exception it produced.

<ScreenshotFrame
  src="/screenshots/requests-detail.png"
  alt="Request detail: request and response tabs, the resolved user, timeline, and related entries."
  caption="Inside a request — request/response, user, timeline, and related entries."
/>

## Queries

The **Queries list** (`/lens/queries`) shows the query string (with a **Slow** badge for queries
over the threshold), duration, provider, and time.

<ScreenshotFrame
  src="/screenshots/queries.png"
  alt="Queries list: each database query with duration, provider, and time."
  caption="The Queries list — with slow-query flagging."
/>

The detail page links back to the originating request and shows the formatted, syntax-highlighted
query.

<ScreenshotFrame
  src="/screenshots/queries-detail.png"
  alt="Query detail: the formatted, syntax-highlighted SQL and a link to the originating request."
  caption="Inside a query — formatted SQL, correlated to its request."
/>

## Cache

The **Cache list** (`/lens/cache`) lists each operation's key and type (`hit`, `miss`, `write`,
`delete`, `clear`) with a color-coded badge.

<ScreenshotFrame
  src="/screenshots/cache.png"
  alt="Cache list: each operation's key and type — hit, miss, write, delete, clear — with a color-coded badge."
  caption="The Cache list — every operation, color-coded by type."
/>

The detail page shows the related request and renders the cached value in a JSON viewer.

<ScreenshotFrame
  src="/screenshots/cache-detail.png"
  alt="Cache detail: the operation, key, and the cached value rendered in a JSON viewer."
  caption="Inside a cache op — the key and value, correlated to its request."
/>

## Exceptions

The **Exceptions list** (`/lens/exceptions`) shows the exception type and message. Toggle
**Grouped** to collapse repeat errors into issues (by fingerprint) with occurrence counts.

<ScreenshotFrame
  src="/screenshots/exceptions.png"
  alt="Exceptions list: exception type and message, with a Grouped toggle to collapse repeats into issues."
  caption="The Exceptions list — group repeats into issues."
/>

The detail page includes the message, a highlighted stacktrace, a code frame around the failing
line, and — when available — the cause and original stack.

<ScreenshotFrame
  src="/screenshots/exceptions-detail.png"
  alt="Exception detail: message, stack trace, and a code frame highlighting the failing line."
  caption="Inside an exception — message, stack trace, and code frame."
/>

<Callout type="tip" title="Get notified">
Configure <a href="/getting-started/alerts-and-notifications">Alerts &amp; Notifications</a> to be
pinged on Slack, Discord, or a webhook the moment a new issue appears.
</Callout>

## Mail

The **Mail list** (`/lens/mail`) captures outgoing email with the subject, recipients, and time.

<ScreenshotFrame
  src="/screenshots/mail.png"
  alt="Mail list: outgoing messages with subject, recipient count, and time."
  caption="The Mail list — audit every outgoing message."
/>

The detail page renders a rich MIME preview — HTML and plain-text parts, iCalendar events, and
attachments — plus headers and metadata, so you can verify exactly what was sent.

<ScreenshotFrame
  src="/screenshots/mail-detail.png"
  alt="Mail detail: summary, a rich MIME preview, headers, and metadata, with a download .eml action."
  caption="Inside a message — summary, MIME preview, headers, and metadata."
/>

## HTTP Client

The **HTTP list** (`/lens/http`) records outbound HTTP calls (via the global `fetch`) with method,
URL, status, and duration — including failures.

<ScreenshotFrame
  src="/screenshots/http.png"
  alt="HTTP client list: outbound requests with method, URL, status, and duration."
  caption="The HTTP list — outbound calls, correlated to the request that made them."
/>

Each entry links back to the request that issued it, and sensitive headers such as `Authorization`
are redacted in the detail view.

<ScreenshotFrame
  src="/screenshots/http-detail.png"
  alt="HTTP call detail: request and response for an outbound fetch, with redacted sensitive headers."
  caption="Inside an outbound call — request/response, with redaction."
/>

## Events

The **Events list** (`/lens/events`) captures application/domain events — both those emitted
manually and those from an instrumented `EventEmitter` — with their name and payload.

<ScreenshotFrame
  src="/screenshots/events.png"
  alt="Events list: application and domain events with their name and payload."
  caption="The Events list — application &amp; domain events."
/>

<ScreenshotFrame
  src="/screenshots/events-detail.png"
  alt="Event detail: the event name and its full payload, correlated to the request that fired it."
  caption="Inside an event — name and payload, correlated to its request."
/>

## Redis

The **Redis list** (`/lens/redis`) records individual Redis commands (`GET`, `SET`, `INCR`,
`DEL`, …) with their arguments, status, and precise timing.

<ScreenshotFrame
  src="/screenshots/redis.png"
  alt="Redis list: individual Redis commands with their arguments, status, and duration."
  caption="The Redis list — every command, with timing."
/>

<ScreenshotFrame
  src="/screenshots/redis-detail.png"
  alt="Redis command detail: the command, arguments, and result, correlated to its request."
  caption="Inside a Redis command — arguments and result."
/>

## Notifications (FCM)

The **FCM list** (`/lens/fcm`) captures Firebase Cloud Messaging sends — single, multicast, topic,
and condition — with per-message delivery status.

<ScreenshotFrame
  src="/screenshots/fcm.png"
  alt="FCM list: push notifications with delivery status, including partial multicast failures."
  caption="The FCM list — push delivery, including partial failures."
/>

<ScreenshotFrame
  src="/screenshots/fcm-detail.png"
  alt="FCM detail: the notification payload, target, and per-token delivery result."
  caption="Inside a push — payload, target, and delivery result."
/>

## Logs

The **Logs list** (`/lens/logs`) captures console output and structured logs with their level,
message, and source. Sensitive fields in log context are redacted before storage.

<ScreenshotFrame
  src="/screenshots/logs.png"
  alt="Logs list: captured console and structured logs with level, message, and source."
  caption="The Logs list — console &amp; structured logs, correlated to requests."
/>

<ScreenshotFrame
  src="/screenshots/logs-detail.png"
  alt="Log detail: the level, message, source, and structured context with sensitive fields redacted."
  caption="Inside a log — level, message, source, and redacted context."
/>

## Jobs & Queues

The **Jobs list** (`/lens/jobs`) tracks background jobs as they move through `active`,
`completed`, and `failed` — each job updates in place — with attempts, duration, and result.

<ScreenshotFrame
  src="/screenshots/jobs.png"
  alt="Jobs list: background jobs moving through active, completed, and failed states."
  caption="The Jobs list — background jobs and their lifecycle."
/>

<ScreenshotFrame
  src="/screenshots/jobs-detail.png"
  alt="Job detail: the job name, queue, data, attempts, duration, and result."
  caption="Inside a job — name, queue, data, attempts, and result."
/>

## Filtering, search, sort & date range

Every list view has a toolbar that filters the **entire dataset on the server** — not just the
loaded rows. Every control is written to the URL, so a filtered view is deep-linkable and
shareable:

- **Search** — debounced substring match across an entry's summary fields.
- **Filters** — per-view dropdowns (method/status, log level, cache operation, …).
- **Date range** — presets (15 min / hour / 24 h / 7 days) or a custom range, stored as absolute timestamps.
- **Sort** — by time (default, newest first) or a column such as duration.
- **Clear** — remove every active filter at once.
- **Export** — download loaded/filtered rows as JSON or CSV, or a request as HAR.

<Callout type="performance" title="Live tail">
The default view — newest-first by time — keeps the <strong>live feed</strong> on, so matching
entries stream in automatically. Choosing an explicit sort switches to stable page-through
ordering and <strong>pauses</strong> the live feed. Clear the sort to resume.
</Callout>

## Live exception toasts

When a new exception is captured, a toast appears in the corner of the dashboard, fed by the live
stream. Toasts are deduplicated by issue fingerprint, respect the recording-pause toggle, and
clicking one opens that exception's detail page.
