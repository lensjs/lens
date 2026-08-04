# Redis Watcher

<p class="lens-lead">
The Redis watcher captures every command sent through an
<a href="https://github.com/redis/ioredis" target="_blank" rel="noreferrer"><code>ioredis</code></a>
client and correlates it to the request that issued it. For each command it records the command
name, arguments, duration, and success/failure status.
</p>

<Callout type="security" title="Redaction & size caps">
<code>AUTH</code> arguments are redacted, and arguments are length- and count-capped.
</Callout>

<Callout type="info" title="Optional dependency">
<code>ioredis</code> is an optional peer dependency of <code>@lensjs/watchers</code>. Install it
in your app if you use this watcher:
</Callout>

<CommandCopy pkg="ioredis" />

## Setup

<Steps>
<Step title="Enable the watcher">

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

</Step>
<Step title="Instrument the client">

Wrap your `ioredis` client with `withLensRedis()`. It patches the client in place and returns
the same instance, so you can wrap it at creation time.

```ts
import Redis from "ioredis";
import { withLensRedis } from "@lensjs/watchers";

const redis = withLensRedis(new Redis(process.env.REDIS_URL));

// Every command is now captured and correlated to the active request.
await redis.set("user:1", JSON.stringify(user));
await redis.get("user:1");
```

</Step>
</Steps>

## Options

```ts
withLensRedis(redis, {
  // Extra command names (case-insensitive) whose args should be redacted.
  redactCommands: ["hset"],
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="layers" title="Cache watcher" href="/watchers/cache">
    Capture cache hits, misses, writes, and deletes across your app.
  </Card>
  <Card icon="boxes" title="Jobs & queues watcher" href="/watchers/jobs">
    Track background jobs from BullMQ and Agenda, one live-updating row per job.
  </Card>
</CardGrid>
