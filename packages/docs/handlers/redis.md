# Redis Watcher

The Redis watcher captures every command sent through an
[`ioredis`](https://github.com/redis/ioredis) client and correlates it to the
request that issued it. For each command it records the command name, arguments,
duration, and success/failure status.

`AUTH` arguments are redacted, and arguments are length- and count-capped.

::: info Optional dependency
`ioredis` is an optional peer dependency of `@lensjs/watchers`. Install it in
your app if you use this watcher: `npm install ioredis`.
:::

## Enable the watcher

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  redisWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    redis: true,
  },
})
```

:::

## Instrument the client

Wrap your `ioredis` client with `withLensRedis()`. It patches the client
in place and returns the same instance, so you can wrap it at creation time.

```ts
import Redis from "ioredis";
import { withLensRedis } from "@lensjs/watchers";

const redis = withLensRedis(new Redis(process.env.REDIS_URL));

// Every command is now captured and correlated to the active request.
await redis.set("user:1", JSON.stringify(user));
await redis.get("user:1");
```

### Options

```ts
withLensRedis(redis, {
  // Extra command names (case-insensitive) whose args should be redacted.
  redactCommands: ["hset"],
});
```
