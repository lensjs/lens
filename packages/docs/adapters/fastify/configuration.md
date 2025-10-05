# Fastify Adapter Configuration

The `lens` function accepts a single configuration object that controls how Lens integrates with your Fastify application. This guide provides a clear reference and practical examples to help you set it up quickly.

## Example: Prisma Query Watcher

Here’s how to enable query watching specifically for **Prisma** in your Fastify application:

```ts
import { lens } from "@lensjs/fastify";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";

const app = Fastify();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  app,
  path: "/lens", // The Lens dashboard will be available at http://localhost:3000/lens
  appName: "My Fastify App",
  queryWatcher: {
    enabled: true, // Enable query watching
    handler: createPrismaHandler({
      prisma,
      provider: "mysql",
    }),
  },
});

await app.listen({ port: 3000 });

console.log("Server listening on http://localhost:3000");
```

## Complete Example: Full Configuration Options

This snippet illustrates all available configuration options for the Fastify adapter, along with inline comments for clarity:

```ts
import { lens } from "@lensjs/fastify";
import { createPrismaHandler } from "@lensjs/watchers";
import { PrismaClient } from "@prisma/client";
import { BetterSqliteStore } from "@lensjs/core"; // Example store implementation
import Fastify, { type FastifyRequest } from "fastify";

const app = Fastify();
const prisma = new PrismaClient({ log: ["query"] });

await lens({
  // Required: Your Fastify application instance.
  app,

  // Optional: Configuration for the query watcher.
  queryWatcher: {
    enabled: true, // Set to true to enable query watching.
    handler: createPrismaHandler({
      prisma,
      provider: "mysql", // Specify your database provider (e.g., "mysql", "postgresql").
    }),
  },

  // Optional: Enable or disable the request watcher. Defaults to `true`.
  requestWatcherEnabled: true,

  // Optional: Enable or disable the exception watcher. defaults to `true`.
  exceptionWatcherEnabled: true,

  // Optional: Enable or disable auto registering of the exception handler. Defaults to `true`.
  registerErrorHandler: true,

  // Optional: Enable or disable the cache watcher. Defaults to `false`.
  cacheWatcherEnabled: true,

  // Optional: The URL path where the Lens dashboard will be accessible. Defaults to "/lens".
  path: "/lens",

  // Optional: The display name for your application in the Lens dashboard. Defaults to "Lens".
  appName: "My Fastify App",

  // Optional: An array of regex patterns for routes that Lens should ignore.
  ignoredPaths: [/^\/health/, /^\/metrics/],

  // Optional: An array of regex patterns to exclusively watch. If provided, only routes matching these patterns will be monitored.
  onlyPaths: [/^\/api/],

  // Optional: An asynchronous function to determine if current request is authenticated.
  isAuthenticated: async (req: FastifyRequest) => {
    const jwtToken = req.headers["authorization"]?.split(" ")[1];
    const jwtSecret = "secret"; // Define or retrieve your JWT secret
    // Replace with your actual JWT validation logic
    return jwtToken === getValidJwtToken(jwtToken, jwtSecret); // getValidJwtToken is a placeholder function
  },

  // Optional: An asynchronous function to resolve and attach user information to Lens events/logs.
  getUser: async (req: FastifyRequest) => {
    // Replace with your actual user retrieval logic
    return {
      id: "123",
      name: "Jane Doe",
      email: "jane@example.com",
    };
  },
});
```
