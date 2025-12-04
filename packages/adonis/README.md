# @lensjs/adonis

AdonisJS adapter for Lens. This package provides a service provider and middleware to seamlessly integrate the Lens monitoring and debugging tool into your AdonisJS applications. It enables automatic logging of requests, database queries, and cache events within the AdonisJS ecosystem.

## Features

*   **`LensServiceProvider`**: Registers the Lens configuration and initializes the Lens core with AdonisJS-specific adapters and watchers during the application boot process.
*   **`AdonisAdapter` class**: Extends `LensAdapter` from `@lensjs/core`, providing AdonisJS-specific implementations for handling HTTP requests, database queries (via Adonis's `db:query` event), cache events, route registration, and serving the Lens UI.
*   **`defineConfig` function**: A helper to define the Lens configuration within `config/lens.ts`, ensuring type safety and proper resolution.
*   **`LensMiddleware`**: An AdonisJS middleware that generates a unique `requestId` for each incoming HTTP request, allowing all subsequent events (queries, cache) within that request's lifecycle to be correlated.
*   **Request Watching**: Captures detailed information about HTTP requests, including method, URL, headers, body, status code, duration, and associated user (if configured).
*   **Query Watching**: Hooks into AdonisJS's database query events to log SQL queries, their bindings, duration, and type.
*   **Cache Watching**: Listens to AdonisJS cache events (read, write, hit, miss, delete, clear) to log cache interactions.
*   **Exception Watching**: Captures and logs exceptions and errors within your AdonisJS application.
*   **UI Serving**: Serves the Lens UI within your AdonisJS application at a configurable path.
*   **Configurable Watchers**: Allows enabling or disabling specific watchers (requests, queries, cache) via the Lens configuration.
*   **Authentication/User Context**: Supports optional `isAuthenticated` and `getUser` functions in the configuration to associate request logs with authenticated users.
*   **Console/Command Ignoring**: Provides utilities to ignore logging for console commands or specific environments.

## Installation

```bash
pnpm add @lensjs/adonis
node ace configure @lensjs/adonis
```
(The `node ace configure` command will typically set up the service provider and config file.)

## Usage Example (config/lens.ts)

```typescript
import { defineConfig } from '@lensjs/adonis';

export default defineConfig({
  appName: 'My Adonis App',
  enabled: true, // Set to false in production
  path: '/lens', // Access Lens UI at /lens
  ignoredPaths: [], // Regex patterns for paths to ignore
  onlyPaths: [],   // Regex patterns for paths to only watch
  watchers: {
    queries: {
      enabled: true,
      provider: 'sqlite', // or 'postgresql', 'mysql', 'mariadb', 'plsql', 'transactsql'
    },
    cache: true,
    requests: true,
    exceptions: true,
  },
  // Optional: Integrate with your authentication system
  isAuthenticated: async (ctx) => {
    return !!ctx.auth.user;
  },
  getUser: async (ctx) => {
    return { id: ctx.auth.user!.id, name: ctx.auth.user!.email };
  },
});
```

## Usage Example (start/kernel.ts - Register Middleware)

```typescript
// ... other imports
import LensMiddleware from '@lensjs/adonis/lens_middleware';

Server.middleware.global([
  // ... other global middleware
  () => new LensMiddleware(), // Register Lens middleware
]);
```
