# Express Adapter

<p class="lens-lead">
The Express adapter integrates Lens into your Express application, capturing requests, queries,
and other events with a couple of lines of code.
</p>

<Callout type="info" title="Requirements">
Node.js 18+ and an Express app. Add <code>@lensjs/watchers</code> too if you want the pre-built
ORM/mailer handlers (Prisma, Kysely, Sequelize, and more).
</Callout>

## Installation

<Steps>
  <Step title="Install the packages">

Install the Express adapter:

<CommandCopy pkg="@lensjs/express" />

If you plan to use pre-built watcher handlers (e.g. Prisma), also install the watchers package:

<CommandCopy pkg="@lensjs/watchers" />

  </Step>
  <Step title="Register Lens">

Here's a minimal setup with a Prisma query watcher:

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

  </Step>
  <Step title="Try it out">

<TerminalWindow title="try it out">
<p><span class="c-dim"># 1.</span> Start your Express application</p>
<p><span class="c-dim"># 2.</span> Trigger a request + query</p>
<p><span class="c-blue">http://localhost:3000/hello-world</span></p>
<p><span class="c-dim"># 3.</span> Open the dashboard</p>
<p><span class="c-green">http://localhost:3000/lens</span> <span class="c-dim"><Icon name="check" :size="12" /> activity captured</span></p>
</TerminalWindow>

  </Step>
</Steps>

## Your dashboard

Once a request comes in, Lens records it and everything it triggered — visible instantly at
`/lens`.

<BrowserMockup url="localhost:3000/lens">
  <img src="/screenshots/requests.png" alt="The Lens dashboard showing captured HTTP requests with method, path, status, and duration" />
</BrowserMockup>

## Next steps

<CardGrid :cols="2">
  <Card icon="settings" title="Configuration" href="/adapters/express/configuration">
    Every option, with sampling, retention, and security.
  </Card>
  <Card icon="database" title="Query watchers" href="/watchers/database">
    Prisma, Kysely, Sequelize, MikroORM, and custom handlers.
  </Card>
</CardGrid>
