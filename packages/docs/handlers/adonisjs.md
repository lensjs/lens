# AdonisJS Watcher Handlers

Lens is deeply integrated into AdonisJS to monitor queries, cache, and exceptions.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package and configured the AdonisJS adapter.

```bash
npm install @lensjs/watchers
node ace configure @lensjs/adonis
```

## 1. Query Watcher

AdonisJS automatically captures queries when the `LENS_ENABLE_QUERY_WATCHER` environment variable is set to `true`.

**`config/lens.ts`**
```ts
watchers: {
  queries: {
    enabled: env.get('LENS_ENABLE_QUERY_WATCHER', true),
    provider: 'sqlite',
  }
}
```

## 2. Cache Watcher

Monitor cache operations by enabling the watcher and emitting events.

**`config/lens.ts`**
```ts
watchers: {
  cache: env.get('LENS_ENABLE_CACHE_WATCHER', true),
}
```

## 3. Exception Watcher

AdonisJS captures all unhandled exceptions and displays them in the Lens dashboard.

**`config/lens.ts`**
```ts
watchers: {
  exceptions: env.get('LENS_ENABLE_EXCEPTION_WATCHER', true),
}
```
