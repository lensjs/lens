---
outline: deep
---

# Quick Start

<p class="lens-lead">
Welcome to Lens! This guide gets you from zero to a live dashboard in just a few minutes.
Lens plugs into your existing framework through a dedicated <strong>adapter</strong> — the first
step is picking the right one.
</p>

## 1. Choose your framework

Select your framework to open its complete, copy-pasteable installation guide.

<CardGrid :cols="3">
  <Card icon="plug" title="Express" href="/adapters/express/installation">
    The reference adapter for Lens.
  </Card>
  <Card icon="plug" title="Fastify" href="/adapters/fastify/installation">
    High-performance, schema-first.
  </Card>
  <Card icon="plug" title="NestJS" href="/adapters/nestjs/installation">
    Over Express or Fastify.
  </Card>
  <Card icon="plug" title="Hono" href="/adapters/hono/installation">
    Edge-ready Node runtimes.
  </Card>
  <Card icon="plug" title="Next.js" href="/adapters/nextjs/installation">
    App Router support.
  </Card>
  <Card icon="plug" title="AdonisJS" href="/adapters/adonis/installation">
    First-class Adonis integration.
  </Card>
</CardGrid>

## 2. The shape of a setup

Every adapter follows the same three-step flow. Here's the Express version — yours will look
nearly identical.

<Steps>
  <Step title="Install the packages">

Add the adapter for your framework, plus the watchers package for ORM/mailer integrations.

<CommandCopy pkg="@lensjs/express @lensjs/watchers" />

  </Step>
  <Step title="Register Lens">

Call `lens()` with your app instance and enable the watchers you want.

```ts
import { lens } from "@lensjs/express";
import express from "express";

const app = express();

await lens({
  app,
  requestWatcherEnabled: true,
});

app.listen(3000);
```

  </Step>
  <Step title="Open the dashboard">

Start your app and visit the dashboard — mounted at `/lens` by default.

<TerminalWindow title="browser">
<p><span class="c-dim"><Icon name="arrow-right" :size="13" /></span> <span class="c-blue">http://localhost:3000/lens</span></p>
<p><span class="c-green"><Icon name="check" :size="13" /></span> Requests, queries, and events stream in live.</p>
</TerminalWindow>

  </Step>
</Steps>

## 3. What's next?

After your adapter is running, go deeper:

<CardGrid :cols="3">
  <Card icon="database" title="Explore watchers" href="/watchers/">
    Configure query, cache, mail, and job watchers to capture more of your app.
  </Card>
  <Card icon="hard-drive" title="Pick a store" href="/getting-started/stores">
    Stay on SQLite or switch to Postgres/MySQL for production.
  </Card>
  <Card icon="shield" title="Secure the dashboard" href="/getting-started/securing-the-dashboard">
    Lock Lens behind a password on any shared environment.
  </Card>
</CardGrid>

<Callout type="tip" title="Prefer to see it first?">
Every adapter guide ends with a "Try it out" section that triggers a request and a query so you
can watch Lens capture them in real time.
</Callout>
