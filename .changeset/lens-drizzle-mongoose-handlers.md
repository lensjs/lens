---
"@lensjs/watchers": minor
---

Add Drizzle and Mongoose query handlers.

- `createDrizzleHandler({ provider })` + `createLensDrizzleLogger()` capture Drizzle ORM queries in-context (pass the logger to `drizzle(client, { logger })`); `provider` is `"postgresql" | "mysql" | "sqlite"`.
- `createMongooseHandler()` + `attachMongooseLens(mongoose)` capture MongoDB operations via Mongoose's `debug` hook, recorded with the `mongodb` provider.
- `drizzle-orm` and `mongoose` are optional peer dependencies. Both hooks fire at query-issue time so queries correlate to the request; neither exposes a duration, so entries are recorded with `0 ms`.
