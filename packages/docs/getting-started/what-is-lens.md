# What is Lens?

<p class="lens-lead">
Lens is a lightweight, framework-agnostic monitoring toolkit for Node.js. It helps you observe
your application in real time — tracking requests, database queries, cache, mail, exceptions, and
custom events — through a simple API and a self-hosted dashboard.
</p>

## Key features

- **Lightweight.** Minimal, non-blocking overhead — capture is queued off your request path, so it never slows your app down.
- **Framework agnostic.** One engine and one dashboard across Express, Fastify, NestJS, Hono, Next.js, and AdonisJS.
- **Correlated by request.** Every query, cache operation, and log line is tied to the request that produced it.
- **Private by default.** Data is written to a store you control, and secrets and PII are redacted before they are persisted.
- **Extensible.** Build custom watchers, stores, adapters, and ORM handlers on top of `@lensjs/core`.

## How it works

Lens uses **adapters** to connect to your framework. Each adapter translates that framework's
request, response, error, and database primitives into neutral calls on the core engine, which
persists them to a pluggable store and serves the dashboard.

<ArchitectureDiagram />

Everything Lens captures is correlated to a single **request id**, so you can trace a request
straight through to the queries, cache operations, and logs it produced.

## Why Lens?

Many monitoring tools are heavy, locked to a single framework, or hard to customize. Lens takes
the opposite approach: fast to set up, universal across Node.js frameworks, and hackable — extend
it with your own adapters, watchers, and data stores whenever you need to.

<Callout type="security" title="Private by design">
Lens is fully self-hosted. Captured data is written to a store you control, and secrets and PII
are redacted before they are ever persisted. See <a href="./securing-the-dashboard">Securing the
Dashboard</a>.
</Callout>

## Next steps

<CardGrid :cols="2">
  <Card icon="rocket" title="Quick Start" href="/getting-started/quick-start">
    Install an adapter and open your dashboard.
  </Card>
  <Card icon="database" title="Watchers" href="/watchers/">
    Capture queries, cache, mail, jobs and more.
  </Card>
  <Card icon="hard-drive" title="Storage Backends" href="/getting-started/stores">
    Use SQLite, Postgres, or MySQL.
  </Card>
  <Card icon="git-branch" title="Contributing" href="/contributing/dev-setup">
    Help shape the future of Lens.
  </Card>
</CardGrid>

## License

Lens is released under the **MIT License**. Project by
[Mohammed Elattar](https://github.com/MohammedElattar). If you find Lens useful, please consider
giving it a [star on GitHub](https://github.com/lensjs/lens).
