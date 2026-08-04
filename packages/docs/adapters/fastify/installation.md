# Fastify Adapter

<p class="lens-lead">
The Fastify adapter integrates Lens into your Fastify application, capturing requests, queries,
and other events with minimal setup.
</p>

<Callout type="info" title="Requirements">
Node.js 18+ and a Fastify app. Add <code>@lensjs/watchers</code> for the pre-built ORM/mailer
handlers.
</Callout>

## Installation

<Steps>
  <Step title="Install the packages">

Install the Fastify adapter:

<CommandCopy pkg="@lensjs/fastify" />

For pre-built watcher handlers (e.g. Prisma), also install the watchers package:

<CommandCopy pkg="@lensjs/watchers" />

  </Step>
  <Step title="Register Lens">

A minimal setup with a Prisma query watcher:

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

  </Step>
  <Step title="Try it out">

<TerminalWindow title="try it out">
<p><span class="c-dim"># 1.</span> Start your Fastify application</p>
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
  <Card icon="settings" title="Configuration" href="/adapters/fastify/configuration">
    All options, including watchers and redaction.
  </Card>
  <Card icon="database" title="Query watchers" href="/watchers/database">
    Wire up Prisma, Kysely, Sequelize, and more.
  </Card>
</CardGrid>
