# HTTP Client Watcher

<p class="lens-lead">
The HTTP client watcher captures <strong>outgoing</strong> HTTP calls made with the global
<code>fetch</code> and correlates each one to the request that issued it. For every call it
records the method, URL, status code, duration, request/response headers and bodies, and any
network error.
</p>

<Callout type="security" title="Redaction & size caps">
Sensitive headers (<code>authorization</code>, <code>cookie</code>, <code>set-cookie</code>,
<code>proxy-authorization</code>, <code>x-api-key</code>) are redacted, and request/response
bodies are size-capped.
</Callout>

## Setup

<Steps>
<Step title="Enable the watcher">

::: code-group

```ts [Express / Fastify / NestJS]
await lens({
  app,
  httpWatcherEnabled: true,
});
```

```ts [AdonisJS (config/lens.ts)]
export default defineConfig({
  watchers: {
    http: true,
  },
})
```

:::

</Step>
<Step title="Instrument fetch">

Call `instrumentFetch()` **once** at startup, before any outgoing calls are made. It is
idempotent and safe to call in any framework.

```ts
import { instrumentFetch } from "@lensjs/watchers";

instrumentFetch();

// Any fetch() from now on is captured and correlated to the active request.
await fetch("https://api.example.com/users");
```

</Step>
</Steps>

## Options

```ts
instrumentFetch({
  captureBody: true, // capture request/response bodies (default: true)
  ignore: (url) => url.includes("/health"), // skip matching URLs
});
```

<Callout type="tip" title="Only the global fetch is instrumented">
The watcher only instruments the global <code>fetch</code>. HTTP clients that use Node's
<code>http</code>/<code>https</code> modules directly (e.g. <code>axios</code> in Node) are not
captured unless they are configured to use <code>fetch</code>.
</Callout>

## Trace propagation

When [OpenTelemetry export](/opentelemetry) is enabled, instrumented calls also carry a W3C
`traceparent` header pointing at the current request's root span, so the service you call joins
the same distributed trace. Nothing is added when tracing is off, and an existing `traceparent`
you set yourself is never overwritten.

## Next steps

<CardGrid :cols="2">
  <Card icon="activity" title="OpenTelemetry export" href="/opentelemetry">
    Forward captured spans and propagate trace context to downstream services.
  </Card>
  <Card icon="git-branch" title="Event watcher" href="/watchers/events">
    Record application and domain events, correlated to the request that emitted them.
  </Card>
</CardGrid>
