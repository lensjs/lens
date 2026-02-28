# Fastify Watcher Handlers

Integrate Lens watchers into your Fastify application to monitor queries, cache, exceptions, and mail.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 1. Query Watcher

Fastify supports Prisma, Kysely, and Sequelize handlers.

### Prisma
```ts
await fastify.register(lens, {
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ prisma, provider: 'mysql' }),
  },
});
```

## 2. Cache Watcher

```ts
await fastify.register(lens, {
  cacheWatcherEnabled: true,
});

// In your application:
watcherEmitter.emit("cache", { action: "hit", key: "k", value: "v" });
```

## 3. Exception Watcher

The exception watcher is integrated into Fastify's error handling.

```ts
await fastify.register(lens, {
  exceptionWatcherEnabled: true,
  registerErrorHandler: true, // Automatically register Fastify error handler
});
```

## 4. Mail Watcher

Capture outgoing emails sent via Nodemailer.

```ts
await fastify.register(lens, {
  mailWatcherEnabled: true,
});

// After sending mail:
await logNodeMailerEntry("smtp", payload, info);
```
