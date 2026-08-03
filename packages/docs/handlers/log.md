# Logs Watcher

The logs watcher captures your application's log output — from `console`,
[`pino`](https://getpino.io), or [`winston`](https://github.com/winstonjs/winston) —
and correlates each entry to the request that produced it. For every log it records
the level, message, structured context, and the source logger.

Sensitive context keys (`password`, `secret`, `token`, `authorization`, `apiKey`, …)
are redacted, and each context payload is size-capped before it is stored.

::: info Optional dependencies
`pino` and `winston` are optional peer dependencies of `@lensjs/watchers`. Install
whichever you use: `npm install pino` or `npm install winston`. The `console`
integration needs no extra dependency.
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

`patchConsole()` wraps the global `console` so every call is captured and
correlated to the active request. It returns a function that restores the
original methods.

```ts
import { patchConsole } from "@lensjs/watchers";

patchConsole();

// Captured as an "info" log correlated to the current request.
console.log("user %s signed in", user.id);
console.error("payment failed", { orderId });
```

## Capture `pino`

Use `createLensPinoStream()` as an **in-thread** pino destination. Do not use it as
a worker `transport` — a worker thread runs detached and cannot see the request
context, so entries would not correlate.

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

Use `emitLensLog(entry)` to feed a custom logger into Lens. `level` and `message`
are required; everything else is optional and correlated automatically.

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
