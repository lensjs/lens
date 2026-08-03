# LensJS — Feature Roadmap & Ideas

A prioritized backlog of features that would make LensJS a more complete, "Telescope-class"
observability tool. Every item is mapped to the existing architecture and its **sanctioned
extension point** (a `Watcher`, a `@lensjs/watchers` handler, a `LensAdapter`, a `Store`, or the
dashboard) so it can be built without breaking a boundary.

> Read `.cursor/rules/architecture.mdc` first. New capture = a `Watcher`; new ORM/mailer/driver =
> a handler; new framework = an adapter; new backend = a `Store`. Never put framework/ORM code in
> core, keep the `minimal_data`/`data` split, and add a changeset for any user-facing change.

## Legend

- **Effort:** S (≤1 day) · M (a few days) · L (1–2 weeks) · XL (multi-week)
- **Impact:** ⭐ nice-to-have · ⭐⭐ strong · ⭐⭐⭐ headline feature

## Baseline — already shipped (do not re-suggest)

9 watchers (request, query, cache, exception, mail, outbound http, event, redis, fcm) ·
handlers for Prisma / Kysely / Sequelize / MikroORM / Nodemailer · adapters for Express /
Fastify / NestJS / Adonis · queued SQLite store with size-based pruning · SSE **live tail** +
polling fallback · **cursor pagination** · **dashboard password auth** (rate-limited) ·
**command palette** · **recording toggle** · client-side **search / filter / sort** +
**stats bar** · request **timeline**, stack-trace + code-frame viewers, SQL/Mongo viewers ·
`hiddenParams` redaction + body purging · **dark theme** (intentionally dark-only).

---

## 1. New Signals (Watchers) — the largest surface

Each is a new `WatcherTypeEnum` member + neutral entry type in `types/index.ts` + a `Watcher`
in `packages/core/src/watchers` + a `Store` read path + `ApiController` endpoint + route in
`lens.ts` + a dashboard view. Emit from adapters/handlers via `lensEmitter`.

| Feature | What it captures | Effort | Impact |
|---|---|---|---|
| **Logs watcher** | App logs from `console`, `pino`, `winston`, `bunyan` (level, message, context, `requestId`) | M | ⭐⭐⭐ |
| **Jobs / Queue watcher** | Background jobs: BullMQ / BeeQueue / Agenda — enqueue, start, complete, fail, retries, duration | L | ⭐⭐⭐ |
| **Scheduled / Cron watcher** | `node-cron` / framework schedulers — run start/end, status, next-run | M | ⭐⭐ |
| **Model / Entity lifecycle watcher** | ORM create/update/delete hooks (Prisma/TypeORM/Sequelize) — the "Models" tab Telescope has | M | ⭐⭐ |
| **Validation watcher** | Failed request validation (zod/class-validator/Joi) with offending fields | S | ⭐⭐ |
| **Notifications watcher** | Generalize FCM into a channel-agnostic notifications signal (push, SMS, Slack, in-app) | M | ⭐⭐ |
| **WebSocket watcher** | `socket.io` / `ws` connections, events in/out, rooms, disconnects | L | ⭐ |
| **GraphQL watcher** | Operation name, resolvers, per-field timing, errors (Apollo/Yoga/Mercurius) | L | ⭐⭐ |
| **gRPC watcher** | Unary/stream calls, status codes, deadlines | L | ⭐ |
| **Dumps / debug watcher** | Explicit `lens.dump(value)` calls surfaced in the UI (Telescope "Dumps") | S | ⭐ |
| **Feature-flag watcher** | Flag evaluations (Unleash/LaunchDarkly/OpenFeature) with variant + `requestId` | M | ⭐ |

## 2. New Handlers — ORM / mailer / driver integrations (`@lensjs/watchers`)

Thin driver→neutral-shape translators in `packages/handlers/src/<signal>/<tool>.ts`. Capture
`requestId` in-context with `getCurrentRequestId()`; keep the driver an optional peer dep.

- **ORMs (query watcher):** TypeORM, **Drizzle**, **Mongoose** (MongoDB), Knex, Objection.js.
- **Mailers (mail watcher):** Resend, SendGrid, AWS SES, Postmark, Mailgun (mirror `nodemailer.ts`).
- **Cache:** `keyv`, `node-cache`, `memcached`, `lru-cache` (mirror `cache/index.ts`).
- **Queues:** BullMQ / Agenda producers feeding the new Jobs watcher.

**Effort** S–M each · **Impact** ⭐⭐ (Drizzle + Mongoose are the highest-demand gaps).

## 3. New Framework Adapters

Extend `LensAdapter`, stay symmetric with the Express template, add a runnable `apps/<fw>`
example + docs + changeset.

| Adapter | Notes | Effort | Impact |
|---|---|---|---|
| **Hono** | Edge/Bun/Node; huge momentum | M | ⭐⭐⭐ |
| **Koa** | Classic middleware model | M | ⭐⭐ |
| **Elysia (Bun)** | Bun-first audience | M | ⭐⭐ |
| **Next.js** | App-router middleware + route handlers | L | ⭐⭐⭐ |
| **Nitro / Nuxt** | Server engine behind Nuxt | L | ⭐⭐ |
| **Hapi** | Enterprise users | M | ⭐ |
| **tRPC** | Procedure-level capture on top of an existing adapter | M | ⭐⭐ |

## 4. New Persistence Backends (Stores)

Implement the full `Store` contract; add cross-cutting behavior as a `compose()` mixin, never a
fork of `BetterSqliteStore`. Keep the `minimal_data`/`data` split + `Paginator` shape.

- **PostgreSQL** & **MySQL** stores — production multi-instance deployments. (L, ⭐⭐⭐)
- **Redis** store — fast, ephemeral, TTL-native. (M, ⭐⭐)
- **MongoDB** store. (M, ⭐)
- **ClickHouse** store — high-volume analytics/retention. (L, ⭐⭐)
- **In-memory** store — tests & zero-config local dev. (S, ⭐⭐)
- **Remote / HTTP collector** store — ship entries to a central Lens server (foundation for a
  multi-service view). (L, ⭐⭐⭐)

## 5. Dashboard / UX

Lives in `packages/core/src/ui`. Reuse `Table`, `DetailPanel`, `TabbedDataViewer`, badges;
build URLs via `prepareApiUrl` + `useConfig()`; **no light theme** (dark-only is a rule).

| Feature | Description | Effort | Impact |
|---|---|---|---|
| **Metrics / analytics overview** | Home dashboard: requests/min, error rate, p50/p95/p99 latency, slowest endpoints & queries, top exceptions (charts) | L | ⭐⭐⭐ |
| **N+1 query detection** | Flag repeated identical/similar queries within one `requestId`; badge on the request | M | ⭐⭐⭐ |
| **Slow & duplicate query flags** | Threshold-based "slow" badge; duplicate-count grouping on the query view | S | ⭐⭐ |
| **Server-side filtering + date range** | Push search/filter/sort/time-range to the store (today it's client-side over the loaded page) | M | ⭐⭐⭐ |
| **Cross-signal global search** | One search box across requests/queries/exceptions/… | M | ⭐⭐ |
| **Saved views / filters** | Persist named filter presets | S | ⭐ |
| **Export** | Download entries as JSON / CSV; requests as **HAR** | S | ⭐⭐ |
| **Entry permalink / share** | Deep-link a single entry (already routable — add copy-link + open-by-id) | S | ⭐ |
| **Request replay** | Re-issue a captured request from the UI (guarded, opt-in) | M | ⭐⭐ |
| **Diff two entries** | Side-by-side request/response or exception diff | M | ⭐ |
| **Grouping & aggregation** | Group exceptions by fingerprint; requests by route template | M | ⭐⭐ |
| **Bookmarks / tags** | Pin or tag entries so they survive pruning | M | ⭐ |
| **Toasts on new exceptions** | Surface live errors from the existing SSE stream | S | ⭐⭐ |

## 6. Alerting & Integrations

- **Outbound notifier** — Slack / Discord / Teams / generic webhook on new exception or
  threshold breach (error-rate, p95 latency, queue backlog). Config-driven; fire off the
  response lifecycle, never blocking. (M, ⭐⭐⭐)
- **Exception fingerprinting & grouping** — Sentry-style stable hash so repeat errors collapse
  into one issue with an occurrence count + first/last seen. (M, ⭐⭐⭐)
- **Email digest** — periodic summary of errors/slow endpoints. (S, ⭐)

## 7. Tracing & APM

- **OpenTelemetry export (OTLP)** — emit captured spans to any OTel backend, and honor W3C
  `traceparent` for cross-service correlation. Positions Lens in real distributed systems. (XL, ⭐⭐⭐)
- **Custom spans API** — `lens.span(name, fn)` for user-defined timings correlated to a request. (M, ⭐⭐)
- **Runtime health sampling** — event-loop lag, GC pauses, memory/CPU as a "system" signal. (M, ⭐⭐)
- **Flame graph** — per-request CPU profile view. (XL, ⭐)

## 8. Data Management, Performance & Cost

- **Sampling** — capture a % of traffic, with error-biased / slow-biased always-on rules; keeps
  overhead and storage bounded under load. (M, ⭐⭐⭐)
- **Retention policies** — auto-purge by age (per signal type), complementing size-based pruning. (S, ⭐⭐)
- **Payload compression** — gzip large stored `data` blobs. (M, ⭐)
- **Metrics rollups** — periodic aggregation tables so the analytics overview stays fast at scale. (L, ⭐⭐)
- **Per-route / conditional capture** — capture only errors, only slow requests, or only matched
  routes (extends `onlyPaths`/`ignoredPaths`). (S, ⭐⭐)

## 9. Security & Privacy

- **Configurable redaction rules** — regex- and JSON-path-based masking beyond the default
  header/body key list. (M, ⭐⭐⭐)
- **PII auto-detection** — mask emails, credit-card numbers, tokens by pattern before `save()`. (M, ⭐⭐)
- **Multi-user dashboard auth + RBAC** — named users/roles on top of the current single-password
  lock; view-only vs admin (truncate/replay). (L, ⭐⭐)
- **IP allowlist** for the dashboard + Lens API. (S, ⭐)
- **Audit log** — record dashboard logins and destructive actions (truncate/replay). (S, ⭐)

## 10. Developer Experience & Tooling

- **Programmatic query API / SDK** — read captured entries from user code/tests (assert "this
  request ran N queries"). (M, ⭐⭐)
- **`lens` CLI** — `tail`, `export`, `purge`, `stats` against the store without the dashboard. (M, ⭐⭐)
- **Prometheus `/metrics` endpoint** — expose counters/histograms for scraping. (M, ⭐⭐)
- **Config schema validation** — validate `LensConfig` at boot with actionable errors. (S, ⭐⭐)
- **More docs & recipes** — one page per adapter/handler + a "write your own watcher/store" guide. (M, ⭐⭐)

## 11. Quality / Testing / Infra

- **Dashboard E2E tests** (Playwright) — currently only unit/Vitest coverage on the backend. (M, ⭐⭐)
- **Benchmark suite** — measure per-request capture overhead & store throughput; guard regressions in CI. (M, ⭐⭐)
- **Adapter parity tests** — a shared conformance suite every adapter runs. (M, ⭐⭐)

---

## Suggested phasing

**Phase 1 — quick wins (S/M, high ROI)**
Logs watcher · Drizzle + Mongoose handlers · N+1 + slow/duplicate query flags · export
(JSON/CSV/HAR) · sampling · retention policies · conditional capture · config validation ·
exception toasts.

**Phase 2 — headline features**
Metrics/analytics overview · server-side filtering + date range · Jobs/Queue watcher ·
Postgres/MySQL store · outbound alerting + exception fingerprinting · Hono & Next.js adapters.

**Phase 3 — big bets**
OpenTelemetry (OTLP) export + trace propagation · remote/central collector store + multi-service
view · RBAC/multi-user auth · ClickHouse store · flame graphs.

---

*Keep every change additive (breaking public API/`exports` = a `major` changeset), non-blocking
on the request path, and redaction-safe. Add tests and docs with each feature.*
