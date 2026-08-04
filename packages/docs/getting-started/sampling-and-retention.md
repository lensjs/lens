---
outline: deep
---

# Sampling & Retention

<p class="lens-lead">
Two levers keep Lens light on busy applications: <strong>sampling</strong> bounds how much you
capture, and <strong>retention</strong> bounds how long you keep it.
</p>

## Sampling

Capture only a fraction of traffic while never dropping errors or slow requests. Correlated signals
(queries, cache, logs, …) are kept or discarded together with their request, so a captured request
always keeps its full timeline.

```ts
await lens({
  app,
  sampling: {
    rate: 0.2, // Capture 20% of requests (0..1; omit or 1 = capture all).
    alwaysOnErrors: true, // Always capture 5xx responses. Defaults to true.
    alwaysOnSlowMs: 1000, // Always capture requests slower than 1s.
  },
});
```

<Callout type="performance" title="Where sampling applies">
Sampling is applied on <strong>Express, Hono, and Next.js</strong>, where the request context wraps
the full lifecycle. When a request is sampled-out, its entries are buffered and only written if an
always-on rule keeps it — so an errored request keeps its queries too.
</Callout>

## Retention

Automatically purge entries older than a max age, per signal type. Configured on
`storeQueueConfig.retention`:

```ts
await lens({
  app,
  storeQueueConfig: {
    retention: {
      defaultMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // Keep 7 days by default.
      perType: {
        request: 3 * 24 * 60 * 60 * 1000, // Keep requests for 3 days.
        query: 24 * 60 * 60 * 1000, // Keep queries for 1 day.
      },
      sweepIntervalMs: 5 * 60 * 1000, // How often to sweep (default: 5 min).
    },
  },
});
```

## Size-based pruning

Complementing age-based retention, cap the database by size — Lens trims the oldest entries once the
store grows past your limit:

```ts
await lens({
  app,
  storeQueueConfig: {
    dbMaxSizeGb: 2, // Start pruning past this size.
    dbPruneSizeGb: 0.5, // How much to trim off when pruning.
  },
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="hard-drive" title="Storage Backends" href="/getting-started/stores">
    Move from SQLite to Postgres or MySQL for production.
  </Card>
  <Card icon="settings" title="Configuration" href="/configuration">
    All store and sampling options in one reference.
  </Card>
</CardGrid>
