# Fastify Exception Handler

This guide explains how to integrate Lens's exception watcher with your Fastify application to monitor and report exceptions.

## Configuration

When initializing Lens with your Fastify application, you can configure its exception watcher using the `exceptionWatcherEnabled` and `registerErrorHandler` options:

```ts
await lens({
  app: fastify,
  exceptionWatcherEnabled: true, // Set to true to enable exception watching (default is true)
  registerErrorHandler: true, // Set to true to allow Lens to register its own error handler (default is true)
});

await fastify.listen({ port: 3000 });

console.log("Server listening on http://localhost:3000");
```

Fastify allows only one error handler at a time. If you need to use your own custom error handler, you should set `registerErrorHandler` to `false`. In this scenario, you can use the `logException` method returned by `lens` to manually log exceptions to Lens:

```ts
const { logException } = await lens({
  app: fastify,
  exceptionWatcherEnabled: true,
  registerErrorHandler: false, // Set to false to use your custom error handler
});

fastify.setErrorHandler((err) => {
  logException(err);

  throw err;
});
```

## Verification

To verify that the exception handler is working correctly, you can intentionally throw an exception in one of your Fastify routes. For example:

```ts
fastify.get('/throw-error', () => {
  throw new Error("Something went wrong");
});
```

After triggering this route (e.g., by visiting `http://localhost:3000/throw-error` in your browser), navigate to the Lens `/exceptions` path in your browser. You should see the details of the captured exception there.
