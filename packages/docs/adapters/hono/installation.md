# Hono Adapter

<p class="lens-lead">
The Hono adapter integrates Lens into your Hono application. It targets the Node.js runtime (via
<code>@hono/node-server</code>), where the default SQLite store runs.
</p>

<Callout type="info" title="Requirements">
Node.js 18+, a Hono app running on <code>@hono/node-server</code>, and optionally
<code>@lensjs/watchers</code> for ORM/mailer handlers.
</Callout>

## Installation

<Steps>
  <Step title="Install the packages">

Install the Hono adapter:

<CommandCopy pkg="@lensjs/hono" />

For pre-built watcher handlers (e.g. Prisma), also install the watchers package:

<CommandCopy pkg="@lensjs/watchers" />

  </Step>
  <Step title="Register Lens">

A minimal setup with a Prisma query watcher:

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

  </Step>
  <Step title="Try it out">

<TerminalWindow title="try it out">
<p><span class="c-dim"># 1.</span> Start your Hono application</p>
<p><span class="c-dim"># 2.</span> Trigger a request + query</p>
<p><span class="c-blue">http://localhost:3000/hello-world</span></p>
<p><span class="c-dim"># 3.</span> Open the dashboard</p>
<p><span class="c-green">http://localhost:3000/lens</span> <span class="c-dim"><Icon name="check" :size="12" /> activity captured</span></p>
</TerminalWindow>

  </Step>
</Steps>

## Your dashboard

<BrowserMockup url="localhost:3000/lens">
  <img src="/screenshots/requests.png" alt="The Lens dashboard showing captured HTTP requests with method, path, status, and duration" />
</BrowserMockup>

## Next steps

<CardGrid :cols="2">
  <Card icon="settings" title="Configuration" href="/adapters/hono/configuration">
    All options, sampling, and password protection.
  </Card>
  <Card icon="database" title="Watchers" href="/watchers/">
    Capture queries, cache, mail, and jobs.
  </Card>
</CardGrid>
