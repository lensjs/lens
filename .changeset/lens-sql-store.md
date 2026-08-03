---
"@lensjs/core": minor
---

Add a production-ready PostgreSQL / MySQL storage backend alongside the default SQLite store, for shared, multi-instance deployments.

- New `QueuedSqlStore` (and the underlying `SqlStore`) implement the full `Store` contract for both engines from a single dialect-parameterized implementation: cursor + offset pagination, server-side search / date-range / field filtering, real-time job upserts (fresh `seq` cursor), and size-based pruning.
- Inject it with `Lens.setStore(new QueuedSqlStore({ dialect: "postgres" | "mysql", connectionString }))` before starting your adapter; works unchanged across Express, Fastify, NestJS, and AdonisJS. You can also pass an existing `pool`.
- `pg` and `mysql2` are optional peer dependencies, imported dynamically only when the matching dialect is used, so SQLite users are unaffected.
- Exposes `SqlStore`, `QueuedSqlStore`, and the `SqlStoreConfig` / `SqlDialect` types from the package barrel.
