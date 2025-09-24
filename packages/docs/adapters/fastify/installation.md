# Fastify Adapter Installation

The **Fastify adapter** seamlessly integrates LensJS into your Fastify application, allowing you to monitor requests, queries, and other events.

## 1. Install Packages

First, install the Fastify adapter package:

```bash
npm install @lensjs/fastify
```

If you plan to use pre-built watcher handlers (e.g., for Prisma), you should also install the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 2. Minimal Setup (with Prisma Query Watcher)

Here's a minimal example demonstrating how to set up Lens with a Fastify application, including a Prisma query watcher:

```ts
import { lens } from "@lensjs/fastify";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";

const app = Fastify();
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

app.get("/hello-world", async () => {
  await prisma.user.create({ data: { name: "Alice" } });
  return { hello: "world" };
});

await app.listen({ port: 3000 });

console.log(`Server running on http://localhost:${port}`);
```

### Try it out

1.  Start your Fastify application.
2.  Visit `http://localhost:3000/hello-world` in your browser. This will trigger a request and a database query, which Lens will log.
3.  Navigate to `http://localhost:3000/lens` to open the Lens dashboard and view the monitored activity.

## 3. Next Steps

*   Explore more advanced configuration options in the [Configuration Guide](./configuration.md).  
