# Jobs Watcher

The Jobs watcher captures background jobs from [BullMQ](https://docs.bullmq.io) and [Agenda](https://github.com/agenda/agenda) and shows **one live-updating row per job** — from `active` to `completed`/`failed` — with its queue, attempts, duration, data, and result/error.

::: info Optional dependencies
`bullmq` and `agenda` are optional peer dependencies of `@lensjs/watchers`. Install whichever you use: `npm install bullmq` or `npm install agenda`.
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

Wrap your `Worker` with `attachBullmqLens()` — it subscribes to the worker's lifecycle events and returns the same instance.

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

Use `emitLensJob()` to feed any queue system. The `id` must be stable across a job's lifecycle (`${queue}:${jobId}`) so Lens updates the same row in place.

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

Background jobs run outside the HTTP request context. To link a job to the request that enqueued it, stamp the request id into the job data at enqueue time and the watcher will pick it up:

```ts
import { getCurrentRequestId } from "@lensjs/core";

await queue.add("resize", { ...payload, __lensRequestId: getCurrentRequestId() });
```
