# NestJS Adapter

<p class="lens-lead">
The NestJS adapter integrates Lens into your NestJS application. NestJS can run on top of Express
or Fastify — Lens supports both.
</p>

<Callout type="info" title="New to NestJS?">
Spin up a project first with the <a href="https://docs.nestjs.com/first-steps#setup" target="_blank" rel="noreferrer">NestJS Quick Start</a>, then come back here.
</Callout>

## Installation

<Steps>
  <Step title="Install the adapter">

<CommandCopy pkg="@lensjs/nestjs" />

  </Step>
  <Step title="Install the HTTP driver">

NestJS runs on Express (default) or Fastify. Install the matching Lens adapter.

<CodeTabs :tabs="['Express', 'Fastify']">
<template #Express>

Express is the default HTTP driver:

<CommandCopy pkg="@lensjs/express" />

</template>
<template #Fastify>

Prefer Fastify? Install its adapter instead:

<CommandCopy pkg="@lensjs/fastify" />

</template>
</CodeTabs>

  </Step>
  <Step title="Register Lens">

A minimal setup with Express looks like this:

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

For Fastify, just pass the `adapter` property:

```ts
await lens({
  adapter: 'fastify',
  app,
});
```

  </Step>
</Steps>

## Your dashboard

<BrowserMockup url="localhost:3000/lens">
  <img src="/screenshots/requests.png" alt="The Lens dashboard showing captured HTTP requests with method, path, status, and duration" />
</BrowserMockup>

## Next steps

<CardGrid :cols="2">
  <Card icon="settings" title="Configuration" href="/adapters/nestjs/configuration">
    Enable watchers and customize Lens.
  </Card>
  <Card icon="database" title="Query watchers" href="/watchers/database">
    Correlate ORM queries to requests.
  </Card>
</CardGrid>
