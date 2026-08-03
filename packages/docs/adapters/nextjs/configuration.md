# Next.js Adapter Configuration

`createLens` accepts a single configuration object and returns the pieces you wire into your app:

- `handlers` — the `GET`/`POST`/`DELETE` Route Handlers for the dashboard, API, and SSE live tail.
- `withLens` — wraps your Route Handlers to capture requests and correlate queries/logs/exceptions.
- `lensMiddleware` — the optional request-id middleware (also available from `@lensjs/nextjs/middleware`).

## Complete Example: Full Configuration Options

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

> The `isAuthenticated`, `getUser`, and `getRequestIp` callbacks receive the Web `Request` object.

## Mounting the Handlers

Re-export the handlers from the catch-all and the config route (see the [Installation Guide](./installation.md)):

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

## Capturing Requests with `withLens`

Only requests that flow through a `withLens`-wrapped Route Handler are captured (there is no global middleware capture in Next.js). Queries, cache operations, logs, and exceptions emitted while the wrapped handler runs are correlated to that request automatically.

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

## Optional: Request-ID Middleware

To correlate a request across middleware and the Route Handler, add the Edge-safe middleware. Import it from the dedicated `@lensjs/nextjs/middleware` subpath so the Node-only engine is not pulled into the Edge bundle:

```ts
// middleware.ts
import { lensMiddleware } from "@lensjs/nextjs/middleware";

export const middleware = lensMiddleware();

export const config = {
  matcher: ["/api/:path*"],
};
```

The middleware stamps a stable `x-lens-request-id` header that `withLens` reuses.

## Password-Protecting the Dashboard

```ts
export const lens = await createLens({
  auth: {
    password: process.env.LENS_PASSWORD!,
  },
});
```

See [Securing the Dashboard](../../getting-started/securing-the-dashboard.md) for all options.
