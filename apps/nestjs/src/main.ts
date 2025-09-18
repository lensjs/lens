import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { createSequelizeHandler } from '@lensjs/watchers';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await lens({
    adapter: 'fastify',
    app,
    appName: 'NestJS Example',
    queryWatcher: {
      enabled: true,
      handler: createSequelizeHandler({ provider: 'mysql' }),
    },
    isAuthenticated: async () => {
      return true;
    },
    getUser: async () => {
      return Promise.resolve({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      });
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
