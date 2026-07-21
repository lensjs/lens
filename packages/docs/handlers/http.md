# HTTP Client Watcher

The HTTP client watcher captures **outgoing** HTTP calls made with the global
`fetch` and correlates each one to the request that issued it. For every call it
records the method, URL, status code, duration, request/response headers and
bodies, and any network error.

Sensitive headers (`authorization`, `cookie`, `set-cookie`,
`proxy-authorization`, `x-api-key`) are redacted, and request/response bodies
are size-capped.

## Enable the watcher

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

## Instrument `fetch`

Call `instrumentFetch()` **once** at startup, before any outgoing calls are
made. It is idempotent and safe to call in any framework.

```ts
import { instrumentFetch } from "@lensjs/watchers";

instrumentFetch();

// Any fetch() from now on is captured and correlated to the active request.
await fetch("https://api.example.com/users");
```

### Options

```ts
instrumentFetch({
  captureBody: true, // capture request/response bodies (default: true)
  ignore: (url) => url.includes("/health"), // skip matching URLs
});
```

::: tip
The watcher only instruments the global `fetch`. HTTP clients that use Node's
`http`/`https` modules directly (e.g. `axios` in Node) are not captured unless
they are configured to use `fetch`.
:::
