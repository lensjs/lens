# Hono Adapter Installation

The **Hono adapter** seamlessly integrates LensJS into your Hono application, allowing you to monitor requests, queries, and other events. It targets the Node.js runtime (via `@hono/node-server`), where the default SQLite store runs.

## 1. Install Packages

First, install the Hono adapter package:

```bash
npm install @lensjs/hono
```

If you plan to use pre-built watcher handlers (e.g., for Prisma), you should also install the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 2. Minimal Setup (with Prisma Query Watcher)

Here's a minimal example demonstrating how to set up Lens with a Hono application, including a Prisma query watcher:

```ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { lens } from "@lensjs/hono";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";

const app = new Hono();
const port = 3000;
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({
      prisma,
      provider: "mysql",
    }),
  },
});

app.get("/hello-world", async (c) => {
  await prisma.user.create({ data: { name: "Alice" } });
  return c.text("Hello world!");
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
```

### Try it out

1.  Start your Hono application.
2.  Visit `http://localhost:3000/hello-world` in your browser. This will trigger a request and a database query, which Lens will log.
3.  Navigate to `http://localhost:3000/lens` to open the Lens dashboard and view the monitored activity.

## 3. Next Steps

*   Explore more advanced configuration options in the [Configuration Guide](./configuration.md).
