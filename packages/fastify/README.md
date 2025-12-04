# @lensjs/fastify

Fastify adapter for Lens. This package provides middleware and integration points to connect your Fastify application with the Lens monitoring and debugging tool. It enables automatic logging of requests, queries (via `@lensjs/watchers`), and cache events.

## Features

*   **`lens(config: FastifyAdapterConfig)` function**: The main entry point to initialize and integrate Lens with a Fastify application.
*   **`FastifyAdapter` class**: Extends `LensAdapter` from `@lensjs/core` to provide Fastify-specific implementations for setting up watchers, registering routes, and serving the Lens UI.
*   **Request Watching**: Automatically captures incoming request details (method, path, headers, body, status, duration, IP) and logs them.
*   **Query Watching**: Integrates with `@lensjs/watchers` to capture database queries from various ORMs (Kysely, Prisma, Sequelize) if configured.
*   **Cache Watching**: Integrates with `@lensjs/watchers` to capture cache events if configured.
*   **Exception Watching**: Captures and logs unhandled exceptions and errors within your Fastify application.
*   **UI Serving**: Serves the Lens UI within your Fastify application at a configurable path.
*   **Configurable Paths**: Allows specifying base paths, ignored paths, and only paths for request watching.
*   **Body Purging**: Prevents sensitive information from being logged in responses by purging certain body types (e.g., file paths, binary data).
*   **Authentication/User Context**: Supports optional `isAuthenticated` and `getUser` functions to associate request logs with authenticated users.

## Installation

```bash
pnpm add @lensjs/fastify
```

## Usage Example

```typescript
import Fastify from 'fastify';
import { lens } from '@lensjs/fastify';
// import { createKyselyHandler } from '@lensjs/watchers/query/kysely'; // Example for Kysely

const fastify = Fastify({
  logger: true
});

// Initialize Lens with Fastify
lens({
  fastify,
  appName: 'My Fastify App',
  enabled: true, // Set to false in production
  path: '/lens-dashboard', // Access Lens UI at /lens-dashboard
  requestWatcherEnabled: true,
  cacheWatcherEnabled: true,
  exceptionWatcherEnabled: true,
  // queryWatcher: {
  //   enabled: true,
  //   handler: createKyselyHandler({ provider: 'sqlite' }), // Or createPrismaHandler, createSequelizeHandler
  // },
  // Optional: Integrate with your authentication system
  isAuthenticated: async (req) => {
    return !!req.headers.authorization;
  },
  getUser: async (req) => {
    // Return user details based on your auth system
    return { id: '1', name: 'Authenticated User' };
  },
});

// Your Fastify routes
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Fastify app listening on ${address}`);
  console.log('Lens UI available at http://localhost:3000/lens-dashboard');
});
```