---
outline: deep
---

# Express Adapter Configuration

<p class="lens-lead">
The <code>lens()</code> function accepts a single configuration object that controls how Lens
integrates with your Express application. This is the complete reference.
</p>

<Callout type="info" title="Full reference">
This page covers the Express-specific setup. For every <code>lens()</code> option in one place —
watchers, filtering, privacy, auth, sampling, and the store — see the
<a href="/configuration">Configuration reference</a>.
</Callout>

## Quick example

Enable query watching for **Prisma**:

```ts
import { lens } from "@lensjs/express";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  app,
  path: "/lens", // dashboard at http://localhost:3000/lens
  appName: "My Express App",
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ prisma, provider: "mysql" }),
  },
});
```

## Watchers at a glance

<CardGrid :cols="3">
  <Card icon="activity" title="requestWatcherEnabled">Capture requests. Default <code>true</code>.</Card>
  <Card icon="bug" title="exceptionWatcherEnabled">Capture exceptions. Default <code>true</code>.</Card>
  <Card icon="database" title="queryWatcher">Capture DB queries via a handler. Off unless set.</Card>
  <Card icon="hard-drive" title="cacheWatcherEnabled">Capture cache ops. Default <code>false</code>.</Card>
  <Card icon="mail" title="mailWatcherEnabled">Capture outgoing mail. Default <code>false</code>.</Card>
  <Card icon="boxes" title="jobWatcherEnabled">Capture jobs/queues. Default <code>false</code>.</Card>
</CardGrid>

## Full configuration reference

This snippet illustrates every available option with inline comments:

```ts
import express, { Request } from "express";
import { lens } from "@lensjs/express";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  // Required: Your Express application instance.
  app,

  // Optional: Configuration for the query watcher.
  queryWatcher: {
    enabled: true, // Set to true to enable query watching.
    handler: createPrismaHandler({
      prisma,
      provider: "mysql", // Specify your database provider (e.g., "mysql", "postgresql").
    }),
  },

  // Optional: Enable or disable the request watcher. Defaults to `true`.
  requestWatcherEnabled: true,

  // Optional: Enable or disable the exception watcher. defaults to `true`.
  exceptionWatcherEnabled: true,

  // Optional: Enable or disable the cache watcher. Defaults to `false`.
  cacheWatcherEnabled: true,

  // Optional: Enable or disable the mail watcher. Defaults to `false`.
  mailWatcherEnabled: true,

  // Optional: Enable or disable the logs watcher (console/pino/winston). Defaults to `false`.
  logWatcherEnabled: true,

  // Optional: Enable or disable the jobs watcher (BullMQ/Agenda). Defaults to `false`.
  jobWatcherEnabled: true,

  // Optional: Outbound alerting on new exception issues (Slack/Discord/webhook).
  // See "Alerts & Notifications" for all options.
  alerts: {
    webhookUrl: process.env.LENS_ALERT_WEBHOOK!,
  },

  // Optional: The URL path where the Lens dashboard will be accessible. Defaults to "/lens".
  path: "/lens",

  // Optional: The display name for your application in the Lens dashboard. Defaults to "Lens".
  appName: "My Express App",

  // Optional: An array of regex patterns for routes that Lens should ignore.
  ignoredPaths: [/^\/health/, /^\/metrics/],

  // Optional: An array of regex patterns to exclusively watch. If provided, only routes matching these patterns will be monitored.
  onlyPaths: [/^\/api/],

  // Optional: An asynchronous function to determine if current request is authenticated.
  isAuthenticated: async (req: Request) => {
    const jwtToken = req.headers["authorization"]?.split(" ")[1];
    const jwtSecret = "secret";
    // Replace with your actual JWT validation logic
    return jwtToken === getValidJwtToken(jwtToken, jwtSecret);
  },

  // Optional: Override how the client IP address is resolved.
  // Use this if your app runs behind a custom proxy setup or uses
  // non-standard forwarding headers.
  //
  // If omitted, Lens falls back to its built-in IP resolver,
  // which detects the IP using proxy headers and socket data.
  getRequestIp: (req: Request) => {return req.ip || ""},

  // Optional: An asynchronous function to resolve and attach user information to Lens events/logs.
  getUser: async (req: Request) => {
    // Replace with your actual user retrieval logic
    return {
      id: "123",
      name: "Jane Doe",
      email: "jane@example.com",
    };
  },

  /**
   * Optional: Configuration to hide sensitive request parameters or headers from being displayed in Lens.
   * This is useful for security and privacy, preventing sensitive data like passwords or authorization tokens
   * from appearing in the monitoring dashboard.
   */
  hiddenParams: {
    headers: [
      'Authorization',
      'Basic',
    ],
    bodyParams: [
      'password',
      'passwordConfirmation',
      'secret',
      'password_confirmation'
    ],
  },

  /**
   * Optional: Configuration for the queued store, which buffers data before writing to the database.
   * This helps optimize performance by reducing the frequency of direct database write operations.
   */
  storeQueueConfig: {
    batchSize: 100, // The number of entries to process in a single batch.
    processIntervalMs: 2_000, // The interval (in milliseconds) at which the queue is processed.
    warnThreshold: 100_000, // A warning will be logged if the queue size exceeds this threshold.
  },
});
```

<Callout type="security" title="Redaction is on by default">
<code>hiddenParams</code> extends Lens's built-in redaction — <code>Authorization</code>/<code>Basic</code>
headers and common password fields are always masked to <code>*******</code> before storage.
</Callout>

## Sampling

Capture only a fraction of traffic while never dropping errors or slow requests. Correlated
signals (queries, cache, logs, …) are kept or discarded together with their request.

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
Sampling is applied on <strong>Express, Hono, and Next.js</strong>, where the request context
wraps the full lifecycle. When a request is sampled-out, its entries are buffered and only
written if an always-on rule keeps it (so an errored request keeps its queries too).
</Callout>

## Retention

Automatically purge entries older than a max age, per signal type — complementing the size-based
`dbMaxSizeGb`/`dbPruneSizeGb` pruning. Configured on `storeQueueConfig.retention`:

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

## Configuration validation

<Callout type="best-practice" title="Fail fast on misconfiguration">
Lens validates your configuration at boot and throws a single, aggregated error listing every
problem it finds (for example an out-of-range <code>sampling.rate</code>, a malformed
<code>alerts.webhookUrl</code>, or a non-numeric retention age), so misconfigurations fail fast
with an actionable message.
</Callout>
