# Jobs & Queues Watcher

<p class="lens-lead">
The Jobs watcher captures background jobs from
<a href="https://docs.bullmq.io" target="_blank" rel="noreferrer">BullMQ</a> and
<a href="https://github.com/agenda/agenda" target="_blank" rel="noreferrer">Agenda</a> and shows
<strong>one live-updating row per job</strong> — from <code>active</code> to
<code>completed</code>/<code>failed</code> — with its queue, attempts, duration, data, and
result/error.
</p>

<Callout type="info" title="Optional dependencies">
<code>bullmq</code> and <code>agenda</code> are optional peer dependencies of
<code>@lensjs/watchers</code>. Install whichever you use:
</Callout>

::: code-group

```bash [bullmq]
npm install bullmq
```

```bash [agenda]
npm install agenda
```

:::

## Enable the watcher

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  jobWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    job: true,
  },
})
```

:::

## BullMQ

Wrap your `Worker` with `attachBullmqLens()` — it subscribes to the worker's lifecycle events and
returns the same instance.

```ts
import { Worker } from "bullmq";
import { attachBullmqLens } from "@lensjs/watchers";

const worker = attachBullmqLens(
  new Worker("emails", async (job) => sendEmail(job.data), { connection }),
);
```

## Agenda

```ts
import { Agenda } from "@hokify/agenda";
import { attachAgendaLens } from "@lensjs/watchers";

const agenda = attachAgendaLens(new Agenda({ db: { address: mongoUrl } }));
```

## Custom queues

Use `emitLensJob()` to feed any queue system. The `id` must be stable across a job's lifecycle
(`${queue}:${jobId}`) so Lens updates the same row in place.

```ts
import { emitLensJob } from "@lensjs/watchers";

emitLensJob({ id: "images:42", name: "resize", queue: "images", status: "active" });
// ...when it finishes
emitLensJob({
  id: "images:42",
  name: "resize",
  queue: "images",
  status: "completed",
  duration: "1.2 s",
});
```

## Correlating a job to a request

Background jobs run outside the HTTP request context. To link a job to the request that enqueued
it, stamp the request id into the job data at enqueue time and the watcher will pick it up:

```ts
import { getCurrentRequestId } from "@lensjs/core";

await queue.add("resize", { ...payload, __lensRequestId: getCurrentRequestId() });
```

## Next steps

<CardGrid :cols="2">
  <Card icon="hard-drive" title="Redis watcher" href="/watchers/redis">
    Capture every ioredis command, correlated to the request that issued it.
  </Card>
  <Card icon="git-branch" title="Event watcher" href="/watchers/events">
    Record application and domain events, correlated to each request.
  </Card>
</CardGrid>
