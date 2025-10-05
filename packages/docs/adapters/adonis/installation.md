# AdonisJS Adapter Installation

The AdonisJS adapter makes it easy to integrate Lens into your AdonisJS app and start monitoring requests, queries, and more.

### Prerequisites

To fully leverage LensJS, you need to enable the `useAsyncLocalStorage` option in your `config/app.ts` file. LensJS relies on this to correctly associate entries with their corresponding requests. If `useAsyncLocalStorage` is not enabled, all monitored entries will be detached from the main request context.

**`config/app.ts`**
```ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'

/**
 * The app key is used for encrypting cookies, generating signed URLs,
 * and by the "encryption" module.
 *
 * The encryption module will fail to decrypt data if the key is lost or
 * changed. Therefore it is recommended to keep the app key secure.
 */
export const appKey = new Secret(env.get('APP_KEY'))

/**
 * The configuration settings used by the HTTP server
 */
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

## 1. Install the Package

Install the AdonisJS adapter using npm:

```bash
npm install @lensjs/adonis
```

## 2. Run the Configure Command

Lens provides a convenient setup command that automates the integration process:

```bash
node ace configure @lensjs/adonis
```

This command will automatically perform the following actions:

*   Create the `config/lens.ts` configuration file.
*   Add the `LensServiceProvider` to your `adonisrc.ts` file.
*   Register the `LensMiddleware` in `start/kernel.ts`.
*   Add Lens-specific environment variable validation to `start/env.ts`.

## 3. Verify the Setup

After running the configure command, you can verify the changes in the following files:

**`adonisrc.ts`**
Ensure the `LensServiceProvider` is listed in your providers array:
```ts
providers: [
  // ... other providers
  () => import('@lensjs/adonis/lens_provider'),
],
```

**`start/kernel.ts`**
Confirm that the `LensMiddleware` is added to your server middleware:
```ts
server.use([
    // ... other middleware
  () => import('@lensjs/adonis/lens_middleware'),
])
```

**`start/env.ts`**
Check for the addition of Lens environment variables:
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

## 4. Lens Configuration File (`config/lens.ts`)

The `config/lens.ts` file is where you can customize the behavior of Lens. Here's an overview of the available options:

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
})

export default lensConfig
```

## Try It Out

1.  Start your AdonisJS application:
    ```bash
    node ace serve --watch
    ```
2.  Access any route in your application to generate requests or database queries.
3.  Open your web browser and navigate to `http://localhost:3333/lens` to view the Lens dashboard and observe your application's activity.

You have successfully integrated Lens into your AdonisJS application!
