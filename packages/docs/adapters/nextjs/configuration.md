---
outline: deep
---

# Next.js Adapter Configuration

<p class="lens-lead">
<code>createLens</code> accepts a single configuration object and returns the pieces you wire into
your app.
</p>

<CardGrid :cols="3">
  <Card icon="route" title="handlers">
    The <code>GET</code>/<code>POST</code>/<code>DELETE</code> Route Handlers for the dashboard, API, and SSE live tail.
  </Card>
  <Card icon="activity" title="withLens">
    Wraps your Route Handlers to capture requests and correlate queries/logs/exceptions.
  </Card>
  <Card icon="git-branch" title="lensMiddleware">
    The optional request-id middleware (also from <code>@lensjs/nextjs/middleware</code>).
  </Card>
</CardGrid>

<Callout type="info" title="Full reference">
This page covers the Next.js-specific setup. For every option in one place, see the
<a href="/configuration">Configuration reference</a>.
</Callout>

## Full configuration reference

```ts
// app/lens.ts
import { createLens } from "@lensjs/nextjs";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query"] });

export const lens = await createLens({
  // Optional: Configuration for the query watcher.
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({
      prisma,
      provider: "postgresql",
    }),
  },

  // Optional: Enable or disable the request watcher. Defaults to `true`.
  requestWatcherEnabled: true,

  // Optional: Enable or disable the exception watcher. Defaults to `true`.
  exceptionWatcherEnabled: true,

  // Optional: Enable or disable the logs watcher (console/pino/winston). Defaults to `false`.
  logWatcherEnabled: true,

  // Optional: Enable or disable the jobs watcher (BullMQ/Agenda). Defaults to `false`.
  jobWatcherEnabled: true,

  // Optional: Outbound alerting on new exception issues (Slack/Discord/webhook).
  alerts: {
    webhookUrl: process.env.LENS_ALERT_WEBHOOK!,
  },

  // Optional: The URL path where the Lens dashboard will be accessible. Defaults to "/lens".
  path: "/lens",

  // Optional: The display name for your application in the Lens dashboard. Defaults to "Lens".
  appName: "My Next.js App",

  // Optional: An array of regex patterns for routes that Lens should ignore.
  ignoredPaths: [/^\/health/],

  // Optional: An asynchronous function to determine if the current request is authenticated.
  isAuthenticated: async (request: Request) => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    return Boolean(token);
  },

  // Optional: Resolve the authenticated user attached to captured requests.
  getUser: async (_request: Request) => ({
    id: "123",
    name: "Jane Doe",
    email: "jane@example.com",
  }),

  // Optional: Override how the client IP is resolved (defaults to x-forwarded-for / x-real-ip).
  getRequestIp: (request: Request) =>
    request.headers.get("x-forwarded-for") ?? "",

  // Optional: Hide sensitive request parameters or headers.
  hiddenParams: {
    headers: ["Authorization", "Basic"],
    bodyParams: ["password", "secret"],
  },
});
```

<Callout type="info" title="Web Request callbacks">
The <code>isAuthenticated</code>, <code>getUser</code>, and <code>getRequestIp</code> callbacks
receive the Web <code>Request</code> object.
</Callout>

## Mounting the handlers

Re-export the handlers from the catch-all and the config route (see the
[Installation Guide](./installation)):

```ts
// app/lens/[[...lensjs]]/route.ts
import { lens } from "../../lens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, DELETE } = lens.handlers;
```

```ts
// app/lens-config/route.ts
import { lens } from "../lens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET } = lens.handlers;
```

## Capturing requests with `withLens`

Only requests that flow through a `withLens`-wrapped Route Handler are captured (there is no
global middleware capture in Next.js). Queries, cache operations, logs, and exceptions emitted
while the wrapped handler runs are correlated to that request automatically.

```ts
// app/api/orders/route.ts
import { lens } from "../../lens";

export const runtime = "nodejs";

export const POST = lens.withLens(async (request: Request) => {
  const body = await request.json();
  // ... your logic ...
  return Response.json({ ok: true, received: body });
});
```

## Optional: request-ID middleware

To correlate a request across middleware and the Route Handler, add the Edge-safe middleware.
Import it from the dedicated `@lensjs/nextjs/middleware` subpath so the Node-only engine is not
pulled into the Edge bundle:

```ts
// middleware.ts
import { lensMiddleware } from "@lensjs/nextjs/middleware";

export const middleware = lensMiddleware();

export const config = {
  matcher: ["/api/:path*"],
};
```

<Callout type="tip" title="Stable request id">
The middleware stamps a stable <code>x-lens-request-id</code> header that <code>withLens</code>
reuses.
</Callout>

## Password-protecting the dashboard

```ts
export const lens = await createLens({
  auth: {
    password: process.env.LENS_PASSWORD!,
  },
});
```

<Callout type="security" title="Learn more">
See <a href="../../getting-started/securing-the-dashboard">Securing the Dashboard</a> for all options.
</Callout>
