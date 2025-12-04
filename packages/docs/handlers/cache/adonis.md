# AdonisJS Cache Watcher

To enable cache monitoring for your AdonisJS application with Lens, you need to ensure that AdonisJS Cache is installed and configured, and then enable the cache watcher in your Lens configuration.

## Prerequisites

First, ensure you have installed and set up the [AdonisJS Cache](https://docs.adonisjs.com/guides/digging-deeper/cache#installation) package in your project.

## Configuring and Enabling the Cache Watcher

Once AdonisJS Cache is set up, you can enable the `cache` option within the `watchers` section of your `config/lens.ts` file. This allows Lens to automatically capture cache-related events.

```ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  // ... other config
  watchers: {
    // Enable cache watching. This can be controlled via the LENS_ENABLE_CACHE_WATCHER environment variable.
    cache: env.get('LENS_ENABLE_CACHE_WATCHER', true), 
  },
})

export default lensConfig
```

Lens automatically integrates with AdonisJS by listening to its internal cache events. This seamless integration means all cache operations (like `hit`, `miss`, `set`, `forget`, `cleared`) are automatically captured and displayed in the Lens UI for real-time monitoring and analysis. For more details on AdonisJS events, refer to the [AdonisJS Events documentation](https://docs.adonisjs.com/guides/references/events#cachedeleted).