---
"@lensjs/core": minor
"@lensjs/watchers": minor
"@lensjs/express": minor
"@lensjs/fastify": minor
"@lensjs/nestjs": minor
"@lensjs/adonis": minor
---

Add a Jobs / Queue watcher that captures background jobs (BullMQ, Agenda) as one live-updating row per job.

- New `job` signal in `@lensjs/core`: `JobWatcher`, `JobEntry`, `WatcherTypeEnum.JOB`, `/api/jobs` endpoints, reader correlation, and a dashboard Jobs view (status badge, queue, attempts, duration, data/result) that also appears in Live Tail and the request timeline.
- The store `save` now upserts by `id` (`INSERT OR REPLACE`) and the dashboard live feed replaces rows by id, so a job's status updates in place (active -> completed/failed) in real time. Unique-id signals are unaffected.
- New driver integrations in `@lensjs/watchers`: `attachBullmqLens(worker)`, `attachAgendaLens(agenda)`, and `emitLensJob()` for custom queues. `bullmq` and `agenda` are optional peer dependencies.
- Enable per adapter with `jobWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.job: true` (AdonisJS).
