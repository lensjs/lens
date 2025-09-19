# Query Watcher for NestJS

This guide explains how to integrate the Lens Query Watcher into your NestJS application. The Query Watcher allows you to monitor and log database queries, providing valuable insights into your application's data access patterns and performance.

Lens provides built-in handlers for popular NestJS database integrations.

## 1. Sequelize

To integrate Sequelize with the Query Watcher, follow these steps:

1.  **Installation:** Ensure you have the NestJS Sequelize package installed as per the [official NestJS documentation](https://docs.nestjs.com/recipes/sql-sequelize#getting-started).

2.  **Configure Sequelize Logging:** In your `database.providers.ts` file (or wherever you configure Sequelize), you need to enable `benchmark` and `logQueryParameters` and configure the `logging` option to emit `sequelizeQuery` events.

    ```ts
    import { Sequelize } from 'sequelize-typescript';
    import { watcherEmitter } from '@lensjs/watchers';
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
            benchmark: true, // Essential for logging query timings
            logQueryParameters: true, // Essential for logging query parameters
            logging: (sql: string, timing?: number) => {
              // Emit the 'sequelizeQuery' event with SQL and timing data
              watcherEmitter.emit('sequelizeQuery', { sql, timing });
            },
          });
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

2.  **Configure PrismaService Logging:** When creating your `PrismaService`, it's crucial to pass the `log` option with `'query'` to the `super` method. This enables Prisma to emit query events that the Query Watcher can capture.

    ```ts
    import { Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';

    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {
      constructor() {
        // This is essential for Prisma to emit query events
        super({
          log: ['query'],
        });
      }

      async onModuleInit() {
        await this.$connect();
      }
    }
    ```

3.  **Integrate with `main.ts`:** In your `main.ts` file, retrieve the `PrismaService` instance from the application context. Then, use `createPrismaHandler` from `@lensjs/watchers` and pass both the `prisma` instance and your database `provider` (e.g., `'sqlite'`, `'postgresql'`) to the `queryWatcher` configuration within the `lens` function.

    ```ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module.js';
    import { lens } from '@lensjs/nestjs';
    import { PrismaService } from './prisma.service.js';
    import { createPrismaHandler } from '@lensjs/watchers';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const prisma = app.get(PrismaService);

      await lens({
        app,
        queryWatcher: {
          enabled: true,
          handler: createPrismaHandler({ prisma, provider: 'sqlite' }), // Replace 'sqlite' with your database provider
        },
      });

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ``````

## 3. Kysely

To integrate Kysely with the Query Watcher, follow these steps:

1.  **Installation:** Install a package that integrates Kysely with NestJS, such as [nestjs-kysely](https://github.com/kazu728/nestjs-kysely).

2.  **Configure Kysely Logging:** In your Kysely module configuration, set up the `log` option to emit `kyselyQuery` events using `watcherEmitter.emit`.

    ```ts
    import { watcherEmitter } from '@lensjs/watchers';
    import { Module } from '@nestjs/common';
    import { KyselyModule as BaseKyselyModule } from 'nestjs-kysely';

    @Module({
      imports: [
        BaseKyselyModule.forRoot({
        // ... other configurations
          log: (event) => {
            // Emit the 'kyselyQuery' event with the query event data
            watcherEmitter.emit('kyselyQuery', event);
          },
        }),
      ],
    })
    export class KyselyModule {}
    ```

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

With these configurations, your NestJS application is now set up to use the Lens Query Watcher for Sequelize, Prisma, or Kysely, providing enhanced visibility into your database operations.

## 4. Custom Handlers

If your ORM or database client is not supported by the built-in handlers, you can create your own custom handler to integrate with Lens.

### Handler Essentials

A custom handler must adhere to the `QueryWatcherHandler` interface and perform the following:

*   Return a `QueryWatcherHandler` function.
*   Call the `onQuery` callback function whenever a query is captured, providing the necessary query details.
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
