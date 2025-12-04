# @lensjs/core

The core library for Lens, providing the fundamental architecture for monitoring and debugging applications. It defines the abstract concepts of adapters, stores, and watchers, along with utilities for event emission, asynchronous context management, and SQL formatting. This package also includes the embedded UI for the Lens dashboard.

## Features

*   **`Lens` class**: The central class for initializing Lens, setting up adapters and watchers, and starting the monitoring process.
*   **`LensAdapter` (abstract class)**: Defines the interface for integrating Lens with different application frameworks (e.g., Express, Adonis). It handles route registration and UI serving.
*   **`LensStore` (abstract class)**: Defines the interface for data storage, allowing Lens to persist and retrieve captured events (requests, queries, cache entries). Includes methods for saving, retrieving, and truncating data.
*   **`LensWatcher` (abstract class)**: Defines the interface for capturing specific types of events within an application.
*   **Concrete Watchers**:
    *   `RequestWatcher`: Captures and logs details of incoming HTTP requests.
    *   `QueryWatcher`: Captures and logs database queries.
    *   `CacheWatcher`: Captures and logs cache interactions.
    *   `ExceptionWatcher`: Captures and logs exceptions and errors.
*   **`ApiController`**: Provides the API endpoints for the Lens UI to fetch monitoring data.
*   **`lensEmitter`**: A global event emitter for internal communication between different parts of Lens.
*   **`lensContext`**: Utilizes `AsyncLocalStorage` for managing asynchronous context, primarily to associate events with a specific request ID.
*   **`lensUtils`**: A collection of utility functions, including:
    *   `generateRandomUuid`: Generates unique IDs.
    *   `interpolateQuery`: Interpolates SQL query placeholders with actual values.
    *   `formatSqlQuery`: Formats SQL queries for readability.
    *   `getMeta`: Provides `__filename` and `__dirname` in both CommonJS and ESM environments.
    *   `isStaticFile`, `stripBeforeAssetsPath`: Utilities for handling static file paths.
    *   `prepareIgnoredPaths`, `shouldIgnoreCurrentPath`: Logic for path-based filtering.
    *   `prettyHrTime`: Formats high-resolution time differences.
*   **`BetterSqliteStore`**: A concrete implementation of `LensStore` using Better SQLite for data persistence.
*   **Embedded UI**: Includes a built-in web interface for visualizing captured application data.

## Installation

```bash
pnpm add @lensjs/core
```

## Usage Example (Conceptual - typically used via framework adapters)

```typescript
import { Lens, RequestWatcher, QueryWatcher, CacheWatcher } from '@lensjs/core';
import { BetterSqliteStore } from '@lensjs/core/stores';
// Assuming you have a custom adapter for your framework
import MyFrameworkAdapter from './my-framework-adapter';

async function bootstrapLens(appInstance: any) {
  const store = new BetterSqliteStore();
  await store.initialize();

  const adapter = new MyFrameworkAdapter({ app: appInstance });

  await Lens.setStore(store)
    .setAdapter(adapter)
    .setWatchers([
      new RequestWatcher(),
      new QueryWatcher(),
      new CacheWatcher(),
      new ExceptionWatcher(),
    ])
    .start({
      appName: 'My Application',
      enabled: process.env.NODE_ENV !== 'production',
      basePath: 'lens-dashboard', // UI will be served at /lens-dashboard
    });

  console.log('Lens core initialized.');
}

// In your application's main entry point:
// bootstrapLens(yourFrameworkAppInstance);
```
