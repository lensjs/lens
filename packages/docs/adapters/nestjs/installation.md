# NestJS Adapter Installation

The **NestJS adapter** seamlessly integrates LensJS into your NestJS application.

If you didn't already, you can create a new nestjs project by following the [NestJS Quick Start](https://docs.nestjs.com/first-steps#setup)

Then you can install lens's nestjs adapter in your project:

```bash
npm install @lensjs/nestjs 
```

NestJS can run on top of Express or Fastify as its HTTP server.
Depending on which one you choose, you’ll need to install the corresponding package.

Using Express (default):

```bash
npm install @lensjs/express
```

Using Fastify:

```bash
npm install @lensjs/fastify
```

A minimal setup with express would look something like this:

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

And for fastify, you only need to pass the adapter property:

```ts
await lens({
  adapter: 'fastify', 
  app,
});
```

### Next Steps

Check out the [Configuration](./configuration.md) Guide to enable watchers and customize LensJS.
