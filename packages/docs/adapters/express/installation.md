# Express Adapter Installation

The **Express adapter** seamlessly integrates LensJS into your Express application, allowing you to monitor requests, queries, and other events.

## 1. Install Packages

First, install the Express adapter package:

```bash
npm install @lensjs/express
```

If you plan to use pre-built watcher handlers (e.g., for Prisma), you should also install the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 2. Minimal Setup (with Prisma Query Watcher)

Here's a minimal example demonstrating how to set up Lens with an Express application, including a Prisma query watcher:

```ts
import { lens } from "@lensjs/express";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
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

app.get("/hello-world", async (_req, res) => {
  await prisma.user.create({ data: { name: "Alice" } });
  res.send("Hello world!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

### Try it out

1.  Start your Express application.
2.  Visit `http://localhost:3000/hello-world` in your browser. This will trigger a request and a database query, which Lens will log.
3.  Navigate to `http://localhost:3000/lens` to open the Lens dashboard and view the monitored activity.

## 3. Next Steps

*   Explore more advanced configuration options in the [Configuration Guide](./configuration.md).  
