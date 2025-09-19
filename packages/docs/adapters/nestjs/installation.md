# NestJS Adapter Installation

The **NestJS adapter** seamlessly integrates LensJS into your NestJS application.

first you need to create a new nestjs project by follow the [NestJS Quick Start](https://docs.nestjs.com/first-steps#setup)

after that you need to install lensjs for your project

```bash
npm install @lensjs/nestjs
```

and based on your adapter you need to install the corresponding dependency so if you are using fastify you need to install it like this and you do the same step for express

```bash
npm install fastify
```

> [!IMPORTANT]
> This package is published as an ES module ("type": "module" in package.json). 
> It does not support CommonJS (require). Please ensure your project is configured for ESM to use this package.

minimal setup for you project if you are depending on expressjs 


```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { lens } from '@lensjs/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await lens({ app });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```


and if you are using fastify you need only to pass the adapter 

```ts
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
    adapter: 'fastify', // Note here the adapter is fastify
    app,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```
