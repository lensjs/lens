# Log Watcher

<p class="lens-lead">
The logs watcher captures your application's log output — from <code>console</code>,
<a href="https://getpino.io" target="_blank" rel="noreferrer"><code>pino</code></a>, or
<a href="https://github.com/winstonjs/winston" target="_blank" rel="noreferrer"><code>winston</code></a>
— and correlates each entry to the request that produced it. For every log it records the level,
message, structured context, and the source logger.
</p>

<Callout type="security" title="Redaction & size caps">
Sensitive context keys (<code>password</code>, <code>secret</code>, <code>token</code>,
<code>authorization</code>, <code>apiKey</code>, …) are redacted, and each context payload is
size-capped before it is stored.
</Callout>

<Callout type="info" title="Optional dependencies">
<code>pino</code> and <code>winston</code> are optional peer dependencies of
<code>@lensjs/watchers</code>. Install whichever you use — the <code>console</code> integration
needs no extra dependency.
</Callout>

::: code-group

```bash [pino]
npm install pino
```

```bash [winston]
npm install winston
```

:::

## Enable the watcher

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  logWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    log: true,
  },
})
```

:::

## Capture `console`

`patchConsole()` wraps the global `console` so every call is captured and correlated to the
active request. It returns a function that restores the original methods.

```ts
import { patchConsole } from "@lensjs/watchers";

patchConsole();

// Captured as an "info" log correlated to the current request.
console.log("user %s signed in", user.id);
console.error("payment failed", { orderId });
```

## Capture `pino`

Use `createLensPinoStream()` as an **in-thread** pino destination.

<Callout type="warning" title="Use an in-thread stream, not a worker transport">
Do not use it as a worker <code>transport</code> — a worker thread runs detached and cannot see
the request context, so entries would not correlate.
</Callout>

```ts
import pino from "pino";
import { createLensPinoStream } from "@lensjs/watchers";

const logger = pino(createLensPinoStream());

// Send Lens a copy while keeping your normal output:
const logger = pino(
  pino.multistream([
    { stream: process.stdout },
    { stream: createLensPinoStream() },
  ]),
);

logger.info({ userId: 1 }, "user created");
```

## Capture `winston`

Add `createLensWinstonTransport()` to your logger's `transports`.

```ts
import winston from "winston";
import { createLensWinstonTransport } from "@lensjs/watchers";

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    createLensWinstonTransport(),
  ],
});

logger.warn("cache miss", { key: "user:1" });
```

## Record logs manually

Use `emitLensLog(entry)` to feed a custom logger into Lens. `level` and `message` are required;
everything else is optional and correlated automatically.

```ts
import { emitLensLog } from "@lensjs/watchers";

emitLensLog({
  level: "error",
  message: "job failed",
  context: { jobId, attempts },
  source: "worker",
});
```

## Options

Every integration accepts extra context keys to redact:

```ts
patchConsole({
  methods: ["warn", "error"], // which console methods to capture (default: all)
  redactKeys: ["ssn"], // extra context keys to mask (merged with defaults)
});

createLensPinoStream({
  messageKey: "msg", // pino's message key (default "msg")
  redactKeys: ["ssn"],
});

createLensWinstonTransport({ redactKeys: ["ssn"] });
```

## Next steps

<CardGrid :cols="2">
  <Card icon="bug" title="Exceptions watcher" href="/watchers/exceptions">
    Capture unhandled errors with stack traces, correlated to each request.
  </Card>
  <Card icon="git-branch" title="Event watcher" href="/watchers/events">
    Record application and domain events, correlated to each request.
  </Card>
</CardGrid>
