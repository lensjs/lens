# NestJS Adapter Configuration

The `lens` function accepts a single configuration object that controls how Lens integrates with your NestJS application. This guide provides a clear reference and practical examples to help you set it up quickly.

## Example: Prisma Query Watcher

Here’s how to enable query watching specifically for **Sequelize** in your NestJS application:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';
import { createSequelizeHandler } from '@lensjs/watchers';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await lens({
    app,
    adapter: 'fastify', // Specify your adapter (e.g., 'express', 'fastify')
    path: '/lens', // The Lens dashboard will be available at http://localhost:3000/lens
    appName: 'My NestJS App',
    queryWatcher: {
      enabled: true, // Enable query watching
      handler: createSequelizeHandler({ provider: 'mysql' }),
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

## Complete Example: Full Configuration Options
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await lens({
    // Required: Your Fastify application instance.
    app,

    adapter: 'fastify', // Default is express

    // Optional: Configuration for the query watcher.
    queryWatcher: {
      enabled: true, // Set to true to enable query watching.
      handler: yourDatabaseHandler({
        provider: 'mysql', // Specify your database provider (e.g., "mysql", "postgresql").
      }),
    },

    // Optional: Enable or disable the request watcher. Defaults to `true`.
    requestWatcherEnabled: true,

    // Optional: Enable or disable the exception watcher. defaults to `true`.
    exceptionWatcherEnabled: true,

    // Optional: Enable or disable the cache watcher. Defaults to `false`.
    cacheWatcherEnabled: true,

    // Optional: The URL path where the Lens dashboard will be accessible. Defaults to "/lens".
    path: '/lens',

    // Optional: The display name for your application in the Lens dashboard. Defaults to "Lens".
    appName: 'My Fastify App',

    // Optional: An array of regex patterns for routes that Lens should ignore.
    ignoredPaths: [/^\/health/, /^\/metrics/],

    // Optional: An array of regex patterns to exclusively watch. If provided, only routes matching these patterns will be monitored.
    onlyPaths: [/^\/api/],

    // Optional: An asynchronous function to determine if current request is authenticated.
    isAuthenticated: async (req: unknown) => {
      const jwtToken = req.headers['authorization']?.split(' ')[1];
      const jwtSecret = "secret"; // Define or retrieve your JWT secret
      // Replace with your actual JWT validation logic
      return jwtToken === getValidJwtToken(jwtToken, jwtSecret); // getValidJwtToken is a placeholder function
    },

    // Optional: An asynchronous function to resolve and attach user information to Lens events/logs.
    getUser: async (req: unknown) => {
      // Replace with your actual user retrieval logic
      return {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
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
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## 3. Next Steps

*   Explore more advanced configuration options in the [Installation Guide](./installation.md).
