---
"@lensjs/core": minor
"@lensjs/watchers": minor
"@lensjs/express": minor
"@lensjs/fastify": minor
"@lensjs/nestjs": minor
"@lensjs/adonis": minor
---

Add a Logs watcher that captures application log output and correlates it to the request that produced it.

- New `log` signal in `@lensjs/core`: `LogWatcher`, `LogEntry`, the `WatcherTypeEnum.LOG` member, the `/api/logs` endpoints, reader correlation, and a dedicated dashboard view (level badge, message, context) that also shows up in Live Tail and the request timeline.
- New driver integrations in `@lensjs/watchers`: `patchConsole()`, `createLensPinoStream()`, `createLensWinstonTransport()`, and `emitLensLog()` for custom loggers. `pino` and `winston` are optional peer dependencies.
- Enable it per adapter via `logWatcherEnabled: true` (Express/Fastify/NestJS) or `watchers.log: true` (AdonisJS). Log context is redacted (password/secret/token/authorization/apiKey…) and size-capped before storage.
