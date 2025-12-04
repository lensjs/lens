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
    queryWatcher: {
      enabled: true,
      handler: createSequelizeHandler({ provider: 'mysql' }),
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
