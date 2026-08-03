# Hono Adapter Configuration

The `lens` function accepts a single configuration object that controls how Lens integrates with your Hono application. This guide provides a clear reference and practical examples to help you set it up quickly.

## Example: Prisma Query Watcher

Here's how to enable query watching specifically for **Prisma** in your Hono application:

```ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { lens } from "@lensjs/hono";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = new Hono();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  app,
  path: "/lens", // The Lens dashboard will be available at http://localhost:3000/lens
  appName: "My Hono App",
  queryWatcher: {
    enabled: true, // Enable query watching
    handler: createPrismaHandler({
      prisma,
      provider: "mysql",
    }),
  },
});

serve({ fetch: app.fetch, port: 3000 });
```

## Complete Example: Full Configuration Options

This snippet illustrates all available configuration options for the Hono adapter, along with inline comments for clarity:

```ts
import { Hono, type Context } from "hono";
import { lens } from "@lensjs/hono";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = new Hono();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  // Required: Your Hono application instance.
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

  // Optional: Enable or disable the exception watcher. Defaults to `true`.
  exceptionWatcherEnabled: true,

  // Optional: Auto-register a global `app.onError` that records exceptions.
  // Defaults to `true`. Set to false if you register your own `app.onError`.
  registerErrorHandler: true,

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
  appName: "My Hono App",

  // Optional: An array of regex patterns for routes that Lens should ignore.
  ignoredPaths: [/^\/health/, /^\/metrics/],

  // Optional: An array of regex patterns to exclusively watch. If provided, only routes matching these patterns will be monitored.
  onlyPaths: [/^\/api/],

  // Optional: An asynchronous function to determine if the current request is authenticated.
  isAuthenticated: async (c: Context) => {
    const token = c.req.header("authorization")?.split(" ")[1];
    // Replace with your actual token validation logic.
    return Boolean(token);
  },

  // Optional: Override how the client IP address is resolved.
  // By default Lens reads `x-forwarded-for` / `x-real-ip`, falling back to the
  // Node socket when running under `@hono/node-server`.
  getRequestIp: (c: Context) => c.req.header("x-forwarded-for") ?? "",

  // Optional: An asynchronous function to resolve and attach user information to Lens events/logs.
  getUser: async (_c: Context) => {
    // Replace with your actual user retrieval logic.
    return {
      id: "123",
      name: "Jane Doe",
      email: "jane@example.com",
    };
  },

  /**
   * Optional: Configuration to hide sensitive request parameters or headers from being displayed in Lens.
   */
  hiddenParams: {
    headers: ["Authorization", "Basic"],
    bodyParams: [
      "password",
      "passwordConfirmation",
      "secret",
      "password_confirmation",
    ],
  },

  /**
   * Optional: Configuration for the queued store, which buffers data before writing to the database.
   */
  storeQueueConfig: {
    batchSize: 100,
    processIntervalMs: 2_000,
    warnThreshold: 100_000,
  },
});
```

## Password-Protecting the Dashboard

Set `auth.password` to lock the dashboard behind a login screen:

```ts
await lens({
  app,
  auth: {
    password: process.env.LENS_PASSWORD!,
  },
});
```

See [Securing the Dashboard](../../getting-started/securing-the-dashboard.md) for all options.
