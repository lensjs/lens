---
outline: deep
---

# Request Watcher

<p class="lens-lead">
The request watcher is the heart of Lens. It records every incoming HTTP request and becomes the
anchor that every other signal — queries, cache, logs, exceptions — correlates to.
</p>

<Callout type="info" title="Enabled by default">
The request watcher is on unless you set <code>requestWatcherEnabled: false</code>. No package to
install — it lives in your framework adapter.
</Callout>

## What gets captured

For each request, Lens records the method, path, status, duration, client IP, and a unique
`requestId`, plus:

- **Request** — headers and body (with sensitive values redacted).
- **Response** — body and headers (large or binary bodies are purged).
- **User** — attached only when you opt in (see below).
- **Correlated signals** — every query, cache op, log, outbound HTTP call, and exception produced
  while the request runs, linked by `requestId`.

## Scope which requests are captured

```ts
await lens({
  app,
  // Ignore noisy routes (Lens's own routes are always ignored).
  ignoredPaths: [/^\/health/, /^\/metrics/],
  // Or capture only certain routes (takes precedence when set).
  onlyPaths: [/^\/api/],
});
```

## Attach the authenticated user

User data is attached **only** when `isAuthenticated` returns true — Lens never scrapes identity
from raw headers or bodies.

```ts
await lens({
  app,
  isAuthenticated: async (req) => Boolean(getToken(req)),
  getUser: async (req) => ({ id: "123", name: "Jane Doe", email: "jane@example.com" }),
});
```

## Redaction

<Callout type="security" title="Secrets are hidden before storage">
Matching request headers and body params are masked to <code>*******</code> before anything is
persisted. Defaults cover <code>Authorization</code>/<code>Basic</code> headers and
<code>password</code>, <code>passwordConfirmation</code>, <code>secret</code>,
<code>password_confirmation</code> body params. Extend them via <code>hiddenParams</code>.
</Callout>

```ts
await lens({
  app,
  hiddenParams: {
    headers: ["Authorization", "Basic"],
    bodyParams: ["password", "secret"],
  },
});
```

## Sampling

On high-traffic apps, capture a fraction of requests while always keeping errors and slow ones. See
[Sampling & Retention](/getting-started/sampling-and-retention) for the full behavior.

```ts
await lens({
  app,
  sampling: { rate: 0.2, alwaysOnErrors: true, alwaysOnSlowMs: 1000 },
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="database" title="Database Queries" href="/watchers/database">
    See the queries each request runs, flagged for N+1 and duplicates.
  </Card>
  <Card icon="settings" title="Configuration" href="/configuration">
    Every request-related option in one reference.
  </Card>
</CardGrid>
