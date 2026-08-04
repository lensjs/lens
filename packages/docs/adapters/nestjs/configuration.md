---
outline: deep
---

# NestJS Adapter Configuration

<p class="lens-lead">
The <code>lens()</code> function accepts a single configuration object that controls how Lens
integrates with your NestJS application. This is the complete reference.
</p>

<Callout type="info" title="Full reference">
This page covers the NestJS-specific setup. For every <code>lens()</code> option in one place, see
the <a href="/configuration">Configuration reference</a>.
</Callout>

## Quick example

Enable query watching for **Sequelize** on a Fastify-powered NestJS app:

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

<Callout type="info" title="Choosing the driver">
Set <code>adapter: 'fastify'</code> to run on Fastify; omit it (or use <code>'express'</code>) for
the default Express driver.
</Callout>

## Full configuration reference

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

    // Optional: Enable or disable the mail watcher. Defaults to `false`.
    mailWatcherEnabled: true,

    // Optional: Enable or disable the logs watcher (console/pino/winston). Defaults to `false`.
    logWatcherEnabled: true,

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

    // Optional: Override how the client IP address is resolved.
    // Use this if your app runs behind a custom proxy setup or uses
    // non-standard forwarding headers.
    //
    // If omitted, Lens falls back to its built-in IP resolver,
    // which detects the IP using proxy headers and socket data.
    getRequestIp: (req: unknown) => {return req.ip || ""},

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

## Next steps

<CardGrid :cols="2">
  <Card icon="plug" title="Installation" href="/adapters/nestjs/installation">
    Back to the setup guide.
  </Card>
  <Card icon="shield" title="Secure the dashboard" href="/getting-started/securing-the-dashboard">
    Add a password lock for shared environments.
  </Card>
</CardGrid>
