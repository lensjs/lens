---
outline: deep
---

# Exception Watcher

<p class="lens-lead">
Lens automatically captures the exceptions your application throws — preserving the full stack
trace and grouping identical errors by fingerprint so repeat failures collapse into a single,
countable entry. The exception watcher is enabled by default; you just wire it into your
framework's error pipeline.
</p>

<Callout type="info" title="Enabled by default">
The exception watcher is on by default via <code>exceptionWatcherEnabled</code> (or
<code>watchers.exceptions</code> in AdonisJS). It's good practice to confirm it explicitly in the
configuration you pass to Lens.
</Callout>

## Setup

Confirm the watcher is enabled, then hook Lens into your framework's error handling.

<CodeTabs :tabs="['Express', 'Fastify', 'NestJS', 'AdonisJS']">
<template #Express>

<Steps>
<Step title="Confirm the watcher is enabled">

Ensure `exceptionWatcherEnabled` is set to `true` within the configuration object passed to the
`lens` initialization function:

```ts
const { handleExceptions } = await lens({
  // ... other options
  exceptionWatcherEnabled: true, // Ensure this is true to enable exception watching
});
```

</Step>
<Step title="Register the error handler">

Lens leverages [Express Error Handling](https://expressjs.com/en/guide/error-handling.html). Call
`handleExceptions` after all your routes are defined so Lens can catch and process any exceptions
that occur within your route handlers:

```ts
// All routes are defined above

handleExceptions();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
```

</Step>
</Steps>

<Callout type="best-practice" title="Register after your routes">
Express runs middleware in registration order, so <code>handleExceptions</code> must be called
after your routes to see the errors they throw. Keep it as the last step before
<code>app.listen</code>.
</Callout>

To verify the handler works, intentionally throw an exception in one of your routes:

```ts
app.get("/throw-error", async (_, res) => {
    throw new Error("Something went wrong");
});
```

After triggering this route, navigate to the Lens `/exceptions` path in your browser, and you
should see the details of the captured exception.

</template>
<template #Fastify>

When initializing Lens with your Fastify application, configure its exception watcher using the
`exceptionWatcherEnabled` and `registerErrorHandler` options:

```ts
await lens({
  app: fastify,
  exceptionWatcherEnabled: true, // Set to true to enable exception watching (default is true)
  registerErrorHandler: true, // Set to true to allow Lens to register its own error handler (default is true)
});

await fastify.listen({ port: 3000 });

console.log("Server listening on http://localhost:3000");
```

**Using a custom error handler**

Fastify allows only one error handler at a time. If you need to use your own custom error
handler, set `registerErrorHandler` to `false`. In this scenario, use the `logException` method
returned by `lens` to manually log exceptions to Lens:

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

<Callout type="best-practice" title="Don't swallow the error">
Calling <code>logException</code> is what records the exception in Lens. After it, re-throw the
error (or send an appropriate response) as shown above so your app's own error handling still
runs, instead of silently swallowing it.
</Callout>

To verify the handler works, intentionally throw an exception in one of your Fastify routes. For
example:

```ts
fastify.get('/throw-error', () => {
  throw new Error("Something went wrong");
});
```

After triggering this route (e.g., by visiting `http://localhost:3000/throw-error` in your
browser), navigate to the Lens `/exceptions` path in your browser. You should see the details of
the captured exception there.

</template>
<template #NestJS>

Ensure the `exceptionWatcherEnabled` option is set to `true` when initializing Lens:

```ts
await lens({
  // ... other options
  exceptionWatcherEnabled: true, // Ensure this is true to enable exception watching
});
```

To verify the handler works, intentionally throw an exception in one of your routes:

```ts
import { Controller, Get, HttpException } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/error')
  throwError() {
    throw new HttpException('This is an error', 400);
  }
}
```

After triggering this route, navigate to the Lens `/exceptions` path in your browser, and you
should see the details of the captured exception.

</template>
<template #AdonisJS>

<Steps>
<Step title="Enable the exception watcher">

Ensure the exception watcher is enabled in your `config/lens.ts` file. It is enabled by default,
but you can set it explicitly:

```ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  // ... other options
  watchers: {
    exceptions: env.get('LENS_ENABLE_EXCEPTION_WATCHER', true), // Ensure this is true to enable exception watching
  },
})

export default lensConfig
```

</Step>
<Step title="Report exceptions from your handler">

Resolve the `watchExceptions` function from the service container within your
`app/exceptions/handler.ts` file and call it in the `report` method. This allows Lens to capture
and process exceptions:

```ts{28}
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Call watchExceptions to allow Lens to monitor this exception
    (await app.container.make('watchExceptions'))?.(error as Exception, ctx)

    return super.report(error, ctx)
  }
}
```

</Step>
</Steps>

<Callout type="best-practice" title="Report only — never respond here">
As the framework notes, you should not attempt to send a response from the <code>report</code>
method. Use it only to hand the error to Lens (and your other reporters), and let
<code>handle</code> produce the client response.
</Callout>

<Callout type="success" title="You're all set">
Once configured, Lens will automatically capture exceptions reported by your AdonisJS
application.
</Callout>

</template>
</CodeTabs>

<Callout type="best-practice" title="Let exceptions propagate">
Lens records the exceptions your application actually throws. If a handler or filter catches and
silently swallows an error, it won't appear in the dashboard — re-throw it or return an
appropriate response so the exception is still reported.
</Callout>

## Grouping & alerts

Identical exceptions are grouped by fingerprint, so a recurring error shows up as one entry with
an occurrence count instead of flooding the list — making it easy to see what's breaking most
often. To get notified the moment a new exception is captured, set up
[alerts & notifications](/getting-started/alerts-and-notifications).

## Next steps

<CardGrid :cols="2">
  <Card icon="bell" title="Alerts & notifications" href="/getting-started/alerts-and-notifications">
    Get notified the moment a new exception is captured.
  </Card>
  <Card icon="gauge" title="Explore the dashboard" href="/dashboard">
    Browse, group, and triage captured exceptions in the UI.
  </Card>
  <Card icon="database" title="All watchers" href="/watchers/">
    See every signal Lens can capture.
  </Card>
</CardGrid>
