# Event Watcher

<p class="lens-lead">
The event watcher records <strong>application and domain events</strong> and correlates them to
the request that emitted them. Use it to trace things like <code>user.registered</code>,
<code>order.placed</code>, or any custom signal your app emits.
</p>

## Enable the watcher

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  eventWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    event: true,
  },
})
```

:::

## Record events manually

Use `emitLensEvent(name, payload?)` to record a single event. The payload is optional and
size-capped.

```ts
import { emitLensEvent } from "@lensjs/watchers";

emitLensEvent("user.registered", { id: user.id, email: user.email });
emitLensEvent("order.placed", { orderId, total });
```

## Capture an EventEmitter automatically

Wrap any Node `EventEmitter` with `instrumentEmitter()` to capture every `emit()` call without
changing your emit sites.

```ts
import { EventEmitter } from "node:events";
import { instrumentEmitter } from "@lensjs/watchers";

const events = new EventEmitter();
instrumentEmitter(events);

// Captured automatically as the "cache.warmed" event.
events.emit("cache.warmed", { keys: 12 });
```

<Callout type="note" title="Internal events are skipped">
<code>newListener</code> / <code>removeListener</code> events are ignored by default.
</Callout>

### Options

```ts
instrumentEmitter(events, {
  only: ["order.placed"], // capture only these event names
  except: ["heartbeat"], // never capture these (merged with internal defaults)
});
```

## Next steps

<CardGrid :cols="2">
  <Card icon="network" title="HTTP client watcher" href="/watchers/http">
    Capture outgoing fetch calls and correlate them to the request that issued them.
  </Card>
  <Card icon="terminal" title="Logs watcher" href="/watchers/logs">
    Capture console, pino, and winston output alongside each request.
  </Card>
</CardGrid>
