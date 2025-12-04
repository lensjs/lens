# @lensjs/express

Express.js adapter for Lens. This package provides middleware and integration points to connect your Express application with the Lens monitoring and debugging tool. It enables automatic logging of requests, queries (via `@lensjs/watchers`), and cache events.

## Features

*   **`lens(config: ExpressAdapterConfig)` function**: The main entry point to initialize and integrate Lens with an Express application.
*   **`ExpressAdapter` class**: Extends `LensAdapter` from `@lensjs/core` to provide Express-specific implementations for setting up watchers, registering routes, and serving the Lens UI.
*   **Request Watching**: Automatically captures incoming request details (method, path, headers, body, status, duration, IP) and logs them.
*   **Query Watching**: Integrates with `@lensjs/watchers` to capture database queries from various ORMs (Kysely, Prisma, Sequelize) if configured.
*   **Cache Watching**: Integrates with `@lensjs/watchers` to capture cache events if configured.
*   **Exception Watching**: Captures and logs unhandled exceptions and errors within your Express application.
*   **UI Serving**: Serves the Lens UI within your Express application at a configurable path.
*   **Configurable Paths**: Allows specifying base paths, ignored paths, and only paths for request watching.
*   **Body Purging**: Prevents sensitive information from being logged in responses by purging certain body types (e.g., file paths, binary data).
*   **Authentication/User Context**: Supports optional `isAuthenticated` and `getUser` functions to associate request logs with authenticated users.

## Installation

```bash
pnpm add @lensjs/express
```

## Usage Example

```typescript
import express from 'express';
import { lens } from '@lensjs/express';
import { createKyselyHandler } from '@lensjs/watchers/query/kysely'; // Example for Kysely

const app = express();
app.use(express.json()); // Enable JSON body parsing

// Example Kysely setup (replace with your actual Kysely instance)
const db = {
  // ... your Kysely instance methods
  // Mocking a Kysely-like interface for demonstration
  on: (event: string, callback: (payload: any) => void) => {
    if (event === 'query') {
      // Simulate a query event
      setTimeout(() => {
        callback({
          level: 'query',
          query: { sql: 'SELECT * FROM users', parameters: [] },
          queryDurationMillis: 15.2,
          error: undefined,
        });
      }, 100);
    }
  },
};

// Initialize Lens with Express
lens({
  app,
  appName: 'My Express App',
  enabled: true, // Set to false in production
  path: '/lens-dashboard', // Access Lens UI at /lens-dashboard
  requestWatcherEnabled: true,
  cacheWatcherEnabled: true,
  exceptionWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createKyselyHandler({ provider: 'sqlite' }), // Or createPrismaHandler, createSequelizeHandler
  },
  // Optional: Integrate with your authentication system
  isAuthenticated: async (req) => {
    return !!req.headers.authorization;
  },
  getUser: async (req) => {
    // Return user details based on your auth system
    return { id: '1', name: 'Authenticated User' };
  },
});

// Your Express routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/users', async (req, res) => {
  // Simulate a database query
  db.on('query', ({ query, queryDurationMillis }) => {
    console.log(`Simulated query: ${query.sql}, Duration: ${queryDurationMillis}ms`);
  });
  res.json([{ id: 1, name: 'Alice' }]);
});

app.listen(3000, () => {
  console.log('Express app listening on port 3000');
  console.log('Lens UI available at http://localhost:3000/lens-dashboard');
});
```
