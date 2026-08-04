---
outline: deep
---

# Configuration Reference

<p class="lens-lead">
Every option accepted by <code>lens()</code>, in one place. The adapter guides show framework-specific
setup; this page is the exhaustive reference they link back to.
</p>

<Callout type="info" title="Same options, every adapter">
Express, Fastify, NestJS, Hono, and AdonisJS share this configuration shape. Adapter-specific
options are noted below. Next.js uses <code>createLens()</code> with the same option names — see the
<a href="/adapters/nextjs/configuration">Next.js configuration</a>.
</Callout>

## General

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `app` | framework app | — | **Required.** Your application instance (Express/Fastify/Nest/Hono). |
| `path` | `string` | `"/lens"` | URL path where the dashboard is served. |
| `appName` | `string` | `"Lens"` | Name shown in the dashboard. |

## Watchers

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `requestWatcherEnabled` | `boolean` | `true` | Capture incoming requests. See [Requests](/watchers/requests). |
| `exceptionWatcherEnabled` | `boolean` | `true` | Capture exceptions. See [Exceptions](/watchers/exceptions). |
| `cacheWatcherEnabled` | `boolean` | `false` | Capture cache operations. See [Cache](/watchers/cache). |
| `mailWatcherEnabled` | `boolean` | `false` | Capture outgoing mail. See [Mail](/watchers/mail). |
| `logWatcherEnabled` | `boolean` | `false` | Capture console/pino/winston logs. See [Logs](/watchers/logs). |
| `jobWatcherEnabled` | `boolean` | `false` | Capture BullMQ/Agenda jobs. See [Jobs](/watchers/jobs). |
| `queryWatcher` | `{ enabled, handler }` | — | Enable DB query capture with an ORM handler. See [Database](/watchers/database). |

## Filtering

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `ignoredPaths` | `RegExp[]` | `[]` | Routes Lens should not record (its own routes are always ignored). |
| `onlyPaths` | `RegExp[]` | — | If set, only matching routes are recorded (takes precedence). |

## User & privacy

| Option | Type | Description |
| --- | --- | --- |
| `isAuthenticated` | `(req) => Promise<boolean>` | Gate whether user data is attached to a request. |
| `getUser` | `(req) => Promise<User \| null>` | Resolve the user attached to captured requests. |
| `getRequestIp` | `(req) => string` | Override client-IP resolution for custom proxy setups. |
| `hiddenParams` | `{ headers, bodyParams }` | Extra header/body keys to redact to `*******` before storage. |

## Alerts, auth, sampling & store

These groups each have a dedicated guide — the key options:

| Group | Option | Description |
| --- | --- | --- |
| `alerts` | `webhookUrl`, `provider`, `cooldownMs`, `everyOccurrence`, `dashboardUrl` | Outbound alerts on new exception issues. See [Alerts & Notifications](/getting-started/alerts-and-notifications). |
| `auth` | `password`, `secret`, `tokenTtl`, `maxAttempts`, `windowMs`, `lockoutMs` | Password-lock the dashboard. See [Securing the Dashboard](/getting-started/securing-the-dashboard). |
| `sampling` | `rate`, `alwaysOnErrors`, `alwaysOnSlowMs` | Capture a fraction of traffic. See [Sampling & Retention](/getting-started/sampling-and-retention). |
| `storeQueueConfig` | `databasePath`, `batchSize`, `processIntervalMs`, `warnThreshold`, `dbMaxSizeGb`, `dbPruneSizeGb`, `retention` | The queued write buffer and pruning. See [Storage Backends](/getting-started/stores). |

## Adapter-specific options

<CodeTabs :tabs="['Fastify', 'Hono', 'NestJS']">
<template #Fastify>

`registerErrorHandler` (default `true`) — set `false` if you register your own Fastify error
handler and want Lens to skip auto-wiring one.

</template>
<template #Hono>

`registerErrorHandler` (default `true`) — set `false` if you register your own `app.onError`.

</template>
<template #NestJS>

`adapter` (default `"express"`) — set to `"fastify"` when your Nest app runs on the Fastify driver.

</template>
</CodeTabs>

## Full annotated example

```ts
await lens({
  app, // required

  // Watchers
  requestWatcherEnabled: true,
  exceptionWatcherEnabled: true,
  cacheWatcherEnabled: true,
  mailWatcherEnabled: true,
  logWatcherEnabled: true,
  jobWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ provider: "mysql" }),
  },

  // Dashboard
  path: "/lens",
  appName: "My App",

  // Filtering
  ignoredPaths: [/^\/health/, /^\/metrics/],
  onlyPaths: [/^\/api/],

  // User & privacy
  isAuthenticated: async (req) => Boolean(getToken(req)),
  getUser: async (req) => ({ id: "123", name: "Jane Doe", email: "jane@example.com" }),
  getRequestIp: (req) => req.ip || "",
  hiddenParams: {
    headers: ["Authorization", "Basic"],
    bodyParams: ["password", "passwordConfirmation", "secret", "password_confirmation"],
  },

  // Outbound alerts on new exception issues
  alerts: { webhookUrl: process.env.LENS_ALERT_WEBHOOK! },

  // Password-lock the dashboard
  auth: { password: process.env.LENS_PASSWORD! },

  // Capture a fraction of traffic (always keep errors + slow requests)
  sampling: { rate: 0.2, alwaysOnErrors: true, alwaysOnSlowMs: 1000 },

  // Queued store + pruning + retention
  storeQueueConfig: {
    batchSize: 100,
    processIntervalMs: 2_000,
    warnThreshold: 100_000,
    dbMaxSizeGb: 2,
    dbPruneSizeGb: 0.5,
    retention: {
      defaultMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
      perType: { request: 3 * 24 * 60 * 60 * 1000, query: 24 * 60 * 60 * 1000 },
      sweepIntervalMs: 5 * 60 * 1000,
    },
  },
});
```

<Callout type="best-practice" title="Validated at boot">
Lens validates your configuration at startup and throws a single aggregated error listing every
problem it finds (an out-of-range <code>sampling.rate</code>, a malformed
<code>alerts.webhookUrl</code>, a non-numeric retention age, …), so misconfigurations fail fast.
</Callout>
