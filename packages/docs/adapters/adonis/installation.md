---
outline: deep
---

# AdonisJS Adapter

<p class="lens-lead">
The AdonisJS adapter makes it easy to integrate Lens into your AdonisJS app and start monitoring
requests, queries, and more — with a single configure command.
</p>

<Callout type="warning" title="Prerequisite: enable AsyncLocalStorage">
Lens relies on <code>useAsyncLocalStorage</code> to associate entries with their request. If it is
not enabled in <code>config/app.ts</code>, all monitored entries will be detached from the request
context.
</Callout>

Enable it in your HTTP config:

```ts
// config/app.ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'

export const appKey = new Secret(env.get('APP_KEY'))

export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,
  useAsyncLocalStorage: false, // [!code --]
  useAsyncLocalStorage: true, // [!code ++]
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})
```

## Installation

<Steps>
<Step title="Install the package">

<CommandCopy pkg="@lensjs/adonis" />

</Step>
<Step title="Run the configure command">

Lens provides a setup command that automates the integration:

<CommandCopy command="node ace configure @lensjs/adonis" />

This automatically:

- Creates the `config/lens.ts` configuration file.
- Adds the `LensServiceProvider` to your `adonisrc.ts` file.
- Registers the `LensMiddleware` in `start/kernel.ts`.
- Adds Lens-specific environment variable validation to `start/env.ts`.

</Step>
<Step title="Verify the setup">

Confirm the changes across these files.

**`adonisrc.ts`** — the provider is registered:

```ts
providers: [
  // ... other providers
  () => import('@lensjs/adonis/lens_provider'),
],
```

**`start/kernel.ts`** — the middleware is added:

```ts
server.use([
    // ... other middleware
  () => import('@lensjs/adonis/lens_middleware'),
])
```

**`start/env.ts`** — the Lens env variables exist:

```ts
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // ... other env variables

  /*
  |--------------------------------------------------------------------------
  | Lens variables
  |--------------------------------------------------------------------------
  */
  LENS_BASE_PATH: Env.schema.string.optional(),
  LENS_ENABLED: Env.schema.boolean.optional(),
  LENS_ENABLE_QUERY_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_REQUEST_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_CACHE_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_EXCEPTION_WATCHER: Env.schema.boolean.optional(),
})
```

</Step>
</Steps>

## Configuration file (`config/lens.ts`)

Customize Lens behavior in `config/lens.ts`:

```ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  appName: env.get('APP_NAME', 'AdonisJs'), // The name of your application displayed in the Lens dashboard.
  enabled: env.get('LENS_ENABLED', false),   // Enable or disable Lens monitoring.
  path: env.get('LENS_BASE_PATH', 'lens'),   // The base path for the Lens dashboard (e.g., /lens).

  ignoredPaths: [], // An array of regex patterns for routes that Lens should ignore. Lens routes are ignored by default.
  onlyPaths: [],    // An array of regex patterns to exclusively watch. If provided, only routes matching these patterns will be monitored.

  watchers: {
    requests: env.get('LENS_ENABLE_REQUEST_WATCHER', true), // Enable or disable the request watcher.
    cache: env('LENS_ENABLE_CACHE_WATCHER', false),         // Enable or disable the cache watcher.
    exceptions: env('LENS_ENABLE_EXCEPTION_WATCHER', true), // Enable or disable the exception watcher.
    queries: {
      enabled: env.get('LENS_ENABLE_QUERY_WATCHER', true), // Enable or disable the query watcher.
      provider: 'sqlite',                                 // The database provider for query watching (e.g., 'sqlite', 'mysql').
    }
  },

  // Optional: An asynchronous function to determine if current request is authenticated.
  isAuthenticated: async (ctx) => {
    return await ctx.auth?.check()
  },

  // Optional: A function to resolve and attach user information to Lens events.
  getUser: async (ctx) => {
    const user = ctx.auth?.user
    if (!user) return null

    return {
      id: user.$primaryKeyValue,
      name: user.name,
      email: user.email,
    }
  },

  /**
   * Optional: Configuration to hide sensitive request parameters or headers from being displayed in Lens.
   * This is useful for security and privacy, preventing sensitive data like passwords or authorization tokens
   * from appearing in the monitoring dashboard.
   */
  hiddenParams: {
    headers: [
      'Authorization',
      'Basic',
    ],
    bodyParams: [
      'password',
      'passwordConfirmation',
      'secret',
      'password_confirmation'
    ],
  },

  /**
   * Optional: Configuration for the queued store, which buffers data before writing to the database.
   * This helps optimize performance by reducing the frequency of direct database write operations.
   */
  storeQueueConfig: {
    batchSize: 100, // The number of entries to process in a single batch.
    processIntervalMs: 2_000, // The interval (in milliseconds) at which the queue is processed.
    warnThreshold: 100_000, // A warning will be logged if the queue size exceeds this threshold.
  },
})

export default lensConfig
```

## Try it out

<Steps>
<Step title="Start the dev server">

<CommandCopy command="node ace serve --watch" />

</Step>
<Step title="Generate some activity">

Access any route in your application to produce requests or database queries.

</Step>
<Step title="Open the dashboard">

Navigate to `http://localhost:3333/lens` to observe your application's activity.

</Step>
</Steps>

<Callout type="success" title="You're set">
Lens is now integrated into your AdonisJS application. Explore the
<a href="/watchers/database">query</a>, <a href="/watchers/cache">cache</a>,
<a href="/watchers/exceptions">exception</a>, and <a href="/watchers/mail">mail</a>
watchers next.
</Callout>
