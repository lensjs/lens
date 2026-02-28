# NestJS Watcher Handlers

This guide explains how to integrate Lens watchers into your NestJS application to monitor queries, cache, exceptions, and mail.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## 1. Query Watcher

NestJS supports Prisma, Kysely, and Sequelize handlers.

### Prisma
In your `PrismaService`:
```ts
super({ log: ['query'] });
```
In `main.ts`:
```ts
const prisma = app.get(PrismaService);
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ prisma, provider: 'sqlite' }),
  },
});
```

### Sequelize
In your database provider:
```ts
logging: (sql, timing) => { watcherEmitter.emit('sequelizeQuery', { sql, timing }); }
```
In `main.ts`:
```ts
await lens({
  app,
  queryWatcher: {
    enabled: true,
    handler: createSequelizeHandler({ provider: 'mysql' }),
  },
});
```

## 2. Cache Watcher

Enable the watcher in `main.ts` and emit events from your cache service.

```ts
await lens({
  app,
  cacheWatcherEnabled: true,
});

// In your service:
watcherEmitter.emit("cache", { action: "hit", key: "k", value: "v" });
```

## 3. Exception Watcher

The exception watcher is enabled by default. It captures standard NestJS `HttpException` and other unhandled errors.

```ts
await lens({
  app,
  exceptionWatcherEnabled: true,
});
```

## 4. Mail Watcher

Capture emails sent via Nodemailer by calling `logNodeMailerEntry` in your mail service.

```ts
await lens({
  app,
  mailWatcherEnabled: true,
});

// In your MailService:
const info = await this.transporter.sendMail(payload);
await logNodeMailerEntry('smtp', payload, info);
```
