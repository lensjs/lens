# Next.js Adapter Installation

The **Next.js adapter** integrates LensJS into a Next.js **App Router** application. Because Next.js has no central `app` object, Lens is wired up through:

- a **catch-all Route Handler** that serves the dashboard, the Lens API, and the SSE live tail, and
- a **`withLens()` wrapper** for your own Route Handlers, which captures the request/response and correlates any queries, logs, and exceptions to it.

It runs on the **Node.js runtime** (the default SQLite store needs Node).

## 1. Install Packages

```bash
npm install @lensjs/nextjs
```

If you plan to use pre-built watcher handlers (e.g., for Prisma), also install `@lensjs/watchers`:

```bash
npm install @lensjs/watchers
```

## 2. Initialize Lens (once)

Create a single Lens instance and reuse it everywhere. `createLens` returns the `handlers` you mount and the `withLens` wrapper.

```ts
// app/lens.ts
import { createLens } from "@lensjs/nextjs";

export const lens = await createLens({
  appName: "My Next.js App",
  logWatcherEnabled: true,
});
```

## 3. Mount the Dashboard + API

Re-export the handlers from a **catch-all** Route Handler and from a separate **`/lens-config`** Route Handler (the dashboard fetches its config from the origin root):

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

> The `runtime = "nodejs"` and `dynamic = "force-dynamic"` exports are required so the engine runs on Node and the SSE stream is not cached.

## 4. Capture Your Own Route Handlers

Wrap any Route Handler with `withLens` to record its request/response and correlate everything emitted during it:

```ts
// app/api/users/route.ts
import { lens } from "../../lens";

export const runtime = "nodejs";

export const GET = lens.withLens(async () => {
  return Response.json({ users: [{ id: 1, name: "Alice" }] });
});
```

## 5. Keep the Engine out of the Bundler

Tell Next.js to treat the Lens packages (and the native SQLite driver) as external server packages:

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@lensjs/core",
    "@lensjs/nextjs",
    "@lensjs/watchers",
    "libsql",
    "better-sqlite3",
  ],
};

export default nextConfig;
```

### Try it out

1.  Start your Next.js app (`npm run dev`).
2.  Visit `http://localhost:3000/api/users` to trigger a captured request.
3.  Navigate to `http://localhost:3000/lens` to open the Lens dashboard.

## 6. Next Steps

*   Explore all options, request correlation, and the optional middleware in the [Configuration Guide](./configuration.md).
