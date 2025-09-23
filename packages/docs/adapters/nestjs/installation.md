# NestJS Adapter Installation

The **NestJS adapter** seamlessly integrates LensJS into your NestJS application.

first you need to create a new nestjs project by follow the [NestJS Quick Start](https://docs.nestjs.com/first-steps#setup)

after that you need to install lensjs for your project

```bash
npm install @lensjs/nestjs 
```

and based on your adapter you need to install the corresponding dependency:

For express:
```bash
npm install @lensjs/express
```
For fastify:


```bash
npm install fastify
```

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

### Next Steps

Check out the [Configuration](./configuration.md) Guide to enable watchers and customize LensJS.