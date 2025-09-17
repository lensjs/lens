import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await lens({
    app,
    appName: 'NestJS Example',
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
