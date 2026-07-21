# Query Watcher for NestJS

This guide explains how to integrate the Lens Query Watcher into your NestJS application. The Query Watcher allows you to monitor and log database queries, providing valuable insights into your application's data access patterns and performance.

Lens provides built-in handlers for popular NestJS database integrations.

## 1. Sequelize

To integrate Sequelize with the Query Watcher, follow these steps:

1.  **Installation:** Ensure you have the NestJS Sequelize package installed as per the [official NestJS documentation](https://docs.nestjs.com/recipes/sql-sequelize#getting-started).

2.  **Configure Sequelize Logging:** In your `database.providers.ts` file (or wherever you configure Sequelize), you need to enable `benchmark` and `logQueryParameters` and configure the `logging` option to emit `sequelizeQuery` events.

    ```ts
    import { Sequelize } from 'sequelize-typescript';
    import { attachSequelizeLens } from '@lensjs/watchers';
    import { TestModel } from './models/user.model.js';

    export const databaseProviders = [
      {
        provide: 'SEQUELIZE',
        useFactory: async () => {
          const sequelize = new Sequelize({
            dialect: 'mysql',
            host: 'localhost',
            port: 3306,
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            benchmark: true, // Essential for accurate query timings
            logQueryParameters: true, // Essential for capturing query parameters
          });

          // Correlates each query to the request that issued it. Sequelize's
          // `logging` callback fires from the driver's detached context, so the
          // request id is captured in-context via `beforeQuery`/`afterQuery`.
          attachSequelizeLens(sequelize);

          sequelize.addModels([TestModel]);
          await sequelize.sync();
          return sequelize;
        },
      },
    ];
    ```

3.  **Integrate with `main.ts`:** In your `main.ts` file, import `createSequelizeHandler` from `@lensjs/watchers` and pass it to the `queryWatcher` configuration within the `lens` function. Specify the database provider you are using (e.g., `'mysql'`, `'sqlite'`).

    ```ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module.js';
    import { lens } from '@lensjs/nestjs';
    import { createSequelizeHandler } from '@lensjs/watchers';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      await lens({
        app,
        queryWatcher: {
          enabled: true,
          handler: createSequelizeHandler({ provider: 'mysql' }), // Replace 'mysql' with your database provider
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ``````

## 2. Prisma

To integrate Prisma with the Query Watcher, follow these steps:

1.  **Installation:** Begin by following the [official NestJS Prisma integration guide](https://docs.nestjs.com/recipes/prisma#getting-started) to set up Prisma in your application.

2.  **Wrap your Prisma client with `withLensPrisma`:** Prisma's `$on("query")` events are emitted across the engine's native boundary, which loses Node's async context — so raw-SQL events cannot be reliably attached to the originating request. `withLensPrisma` wraps the client with a [Prisma Client extension](https://www.prisma.io/docs/orm/prisma-client/client-extensions) that captures the request id **in-context** (at query-issue time), guaranteeing correct correlation even under concurrency. Because an extended client has a different type than `PrismaClient`, expose it through a factory provider and use it everywhere you query.

    ```ts
    // src/prisma.ts
    import { PrismaClient } from '@prisma/client';
    import { withLensPrisma } from '@lensjs/watchers';

    export const PRISMA = Symbol('PRISMA');

    export const createLensPrismaClient = () =>
      withLensPrisma(new PrismaClient(), { provider: 'sqlite' }); // your provider

    export type LensPrismaClient = ReturnType<typeof createLensPrismaClient>;
    ```

    ```ts
    // src/prisma.module.ts
    import { Global, Module } from '@nestjs/common';
    import { PRISMA, createLensPrismaClient } from './prisma.js';

    @Global()
    @Module({
      providers: [{ provide: PRISMA, useFactory: createLensPrismaClient }],
      exports: [PRISMA],
    })
    export class PrismaModule {}
    ```

    Inject it where you access the database: `constructor(@Inject(PRISMA) private readonly prisma: LensPrismaClient) {}`.

3.  **Integrate with `main.ts`:** Register `createPrismaHandler` from `@lensjs/watchers` with your database `provider` (e.g., `'sqlite'`, `'postgresql'`). You no longer pass the client — correlation is handled by the wrapper's extension.

    ```ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module.js';
    import { lens } from '@lensjs/nestjs';
    import { createPrismaHandler } from '@lensjs/watchers';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      await lens({
        app,
        queryWatcher: {
          enabled: true,
          handler: createPrismaHandler({ provider: 'sqlite' }), // Replace 'sqlite' with your database provider
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ``````

    > **Legacy note:** `createPrismaHandler({ prisma, provider })` (passing a raw client) still works and shows raw SQL via `$on`, but it **cannot correlate** queries to requests. Prefer `withLensPrisma`.

## 3. Kysely

To integrate Kysely with the Query Watcher, follow these steps:

1.  **Installation:** Install a package that integrates Kysely with NestJS, such as [nestjs-kysely](https://github.com/kazu728/nestjs-kysely).

2.  **Configure Kysely Logging:** In your Kysely module configuration, set up the `log` option to emit `kyselyQuery` events using `watcherEmitter.emit`.

    ```ts
    import { createLensKyselyPlugin, watcherEmitter } from '@lensjs/watchers';
    import { Module } from '@nestjs/common';
    import { KyselyModule as BaseKyselyModule } from 'nestjs-kysely';

    @Module({
      imports: [
        BaseKyselyModule.forRoot({
        // ... other configurations
          plugins: [createLensKyselyPlugin()], // captures the request id in-context
          log: (event) => {
            // Emit the 'kyselyQuery' event with the query event data
            watcherEmitter.emit('kyselyQuery', event);
          },
        }),
      ],
    })
    export class KyselyModule {}
    ```

    > **Why `createLensKyselyPlugin`?** Kysely's `log` callback fires from the driver's detached completion context; the plugin captures the request id in-context at compile time and links it to the log event via Kysely's `queryId`. Without it, queries are recorded but not correlated.

3.  **Integrate with `main.ts`:** In your `main.ts` file, import `createKyselyHandler` from `@lensjs/watchers` and pass it to the `queryWatcher` configuration within the `lens` function. You can also configure optional settings like `logQueryErrorsToConsole`.

    ```ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module.js';
    import { lens } from '@lensjs/nestjs';
    import {
      FastifyAdapter,
      NestFastifyApplication,
    } from '@nestjs/platform-fastify';
    import { createKyselyHandler } from '@lensjs/watchers';

    async function bootstrap() {
      const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
      );
      await lens({
        adapter: 'fastify',
        app,
        cacheWatcherEnabled: true,
        queryWatcher: {
          enabled: true,
          handler: createKyselyHandler({
            provider: 'sqlite',
            logQueryErrorsToConsole: true, // Optional: Set to true to log query errors to the console
          }),
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```

With these configurations, your NestJS application is now set up to use the Lens Query Watcher for Sequelize, Prisma, Kysely, or MikroORM, providing enhanced visibility into your database operations.

## 4. MikroORM

To integrate MikroORM with the Query Watcher, follow these steps:

1.  **Installation:** Install MikroORM and its NestJS integration following the [official MikroORM documentation](https://mikro-orm.io/docs/guide/first-entity).

2.  **Configure MikroORM:** No special logger is required for correlation — `attachMikroOrmLens` (next step) captures the request id in-context from the underlying knex driver.

    ```ts
    // mikro-orm.config.ts
    import { defineConfig } from "@mikro-orm/postgresql";

    export default defineConfig({
      // ... your MikroORM options (entities, dbName, etc.)
    });
    ```

3.  **Integrate with `main.ts`:** Attach Lens to the MikroORM instance (so queries correlate to their request) and register `createMikroOrmHandler`.

    ```ts
    import { NestFactory } from "@nestjs/core";
    import { MikroORM } from "@mikro-orm/core";
    import { AppModule } from "./app.module.js";
    import { lens } from "@lensjs/nestjs";
    import { createMikroOrmHandler, attachMikroOrmLens } from "@lensjs/watchers";

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      // Captures the request id in-context from the underlying knex driver.
      attachMikroOrmLens(app.get(MikroORM));

      await lens({
        app,
        queryWatcher: {
          enabled: true,
          handler: createMikroOrmHandler({ provider: "postgresql" }),
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```

    > **Alternative (no correlation):** `MikroOrmLensLogger` remains available as a `loggerFactory` (with `debug: true`) for console-style capture without request correlation. Use `attachMikroOrmLens` **or** the logger, not both.

> **Note:** Transaction queries (`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`) are automatically filtered out by the handler.

## 5. Custom Handlers

If your ORM or database client is not supported by the built-in handlers, you can create your own custom handler to integrate with Lens.

### Handler Essentials

A custom handler must adhere to the `QueryWatcherHandler` interface and perform the following:

*   Return a `QueryWatcherHandler` function.
*   Call the `onQuery` callback function whenever a query is captured, providing the necessary query details.
*   Query log/event callbacks from most drivers fire from a **detached context** (a native boundary, connection pool, worker, or external emitter) where the async context is already lost. Capture the request id at an **in-context** hook (ORM plugin/hook that runs at query-issue time) with `getCurrentRequestId()` from `@lensjs/core` and pass it as the second argument: `onQuery(entry, requestId)`. The built-in integrations do this for you via `withLensPrisma`, `attachSequelizeLens`, `createLensKyselyPlugin`, and `attachMikroOrmLens`.
*   Optionally utilize `lensUtils` for common tasks:
    *   `interpolateQuery(sql, params)`: Injects parameters into a SQL query string.
    *   `formatSqlQuery(query)`: Formats a SQL query for better readability.
    *   `nowISO()`: Generates a timestamp.

### Example: Custom Handler for a Generic ORM

This example demonstrates how to create a custom handler for a generic ORM within a NestJS application. We'll create a dedicated service to manage the custom handler logic.

1.  **Create a Custom Query Emitter Service:**

    First, create a service that will be responsible for emitting custom query events. This service will expose a method to register a listener for your ORM's query events and then emit them in a format compatible with Lens.

    ```ts
    // src/custom-query-emitter.service.ts
    import { Injectable } from '@nestjs/common';
    import Emittery from 'emittery'; // You'll need to install this package: npm install emittery

    // Create a global or module-scoped event emitter for your custom ORM queries
    export const myOrmEventEmitter = new Emittery();

    @Injectable()
    export class CustomQueryEmitterService {
      // This method would be called by your ORM's logging mechanism
      emitCustomQuery(query: string, params: any[], duration: number) {
        myOrmEventEmitter.emit('customOrmQuery', { query, params, duration });
      }
    }
    ```

2.  **Configure Your ORM's Logging:**

    Integrate your ORM's logging mechanism to call `emitCustomQuery` from the `CustomQueryEmitterService`. The exact implementation will depend on your ORM. For example, if your ORM has a `logging` callback:

    ```ts
    // In your ORM configuration (e.g., a database module)
    import { CustomQueryEmitterService } from './custom-query-emitter.service';

    // ... ORM setup ...
    const customQueryEmitterService = new CustomQueryEmitterService(); // Or inject it if in a NestJS module

    yourOrmInstance.configure({
      logging: (query: string, params: any[], duration: number) => {
        customQueryEmitterService.emitCustomQuery(query, params, duration);
      },
    });
    ```

3.  **Create the Custom Query Watcher Handler:**

    Now, create the actual `QueryWatcherHandler` function that listens to the events emitted by `CustomQueryEmitterService` and formats them for Lens.

    ```ts
    // src/custom-query.handler.ts
    import { type QueryWatcherHandler } from '@lensjs/watchers';
    import { lensUtils } from '@lensjs/core';
    import { nowISO } from '@lensjs/date';
    import { myOrmEventEmitter } from './custom-query-emitter.service'; // Import your custom event emitter

    export function createCustomQueryHandler(): QueryWatcherHandler {
      return async ({ onQuery }) => {
        const databaseType = 'your-orm-type'; // e.g., 'mongodb', 'cassandra'

        myOrmEventEmitter.on('customOrmQuery', (payload: { query: string; params: any[]; duration: number }) => {
          onQuery({
            query: lensUtils.formatSqlQuery(
              lensUtils.interpolateQuery(
                payload.query,
                payload.params,
              ),
              databaseType,
            ),
            duration: `${payload.duration} ms`,
            type: databaseType,
            createdAt: nowISO(),
          });
        });
      };
    }
    ```

4.  **Integrate into `main.ts`:**

    Finally, import your `createCustomQueryHandler` function and pass it to the `queryWatcher` configuration in your `main.ts` file.

    ```ts
    // src/main.ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module.js';
    import { lens } from '@lensjs/nestjs';
    import { createCustomQueryHandler } from './custom-query.handler.js'; // Adjust path as needed

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      // Ensure CustomQueryEmitterService is provided in AppModule or a related module
      // const customQueryEmitterService = app.get(CustomQueryEmitterService);
      // (If your ORM logging needs the service instance directly)

      await lens({
        app,
        queryWatcher: {
          enabled: true,
          handler: createCustomQueryHandler(),
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```

This setup allows you to capture and display queries from any ORM or database client in the Lens UI by creating a custom handler that translates its logging output into the Lens-compatible format.
