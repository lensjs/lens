---
outline: deep
---

# Mail Watcher

<p class="lens-lead">
Audit every outgoing email your app sends. The mail watcher reconstructs a full
<strong>MIME preview</strong> (HTML + text), captures <strong>iCalendar</strong> events and
<strong>attachments</strong>, and correlates each message to the request that triggered it. Enable
it with <code>mailWatcherEnabled</code> and review everything in the dashboard's
<strong>Mail</strong> tab.
</p>

## Setup

<Callout type="info" title="Prerequisite">
The <strong>Express</strong>, <strong>Fastify</strong>, and <strong>NestJS</strong> integrations
send mail through <strong>Nodemailer</strong>: install the <code>@lensjs/watchers</code> package
(it bundles the Nodemailer mail handler) and call <code>logNodeMailerEntry()</code> after each
successful send. <strong>AdonisJS</strong> is automatic — it listens to the <code>mail:sent</code>
event emitted by <code>@adonisjs/mail</code>, so it needs no extra package and no logging call.
</Callout>

<CodeTabs :tabs="['Express','Fastify','NestJS','AdonisJS']">
<template #Express>

<CommandCopy pkg="@lensjs/watchers" />

<Steps>
<Step title="Enable the Mail Watcher">

Set `mailWatcherEnabled: true` when initializing Lens.

```ts
import express from "express";
import { lens } from "@lensjs/express";

const app = express();

await lens({
  app,
  mailWatcherEnabled: true, // This enables the mail storage and UI
  // ... other config
});
```

</Step>
<Step title="Log Sent Emails">

Since emails are sent via external drivers, you need to call `logNodeMailerEntry` after a
successful `sendMail` call.

```ts
import { logNodeMailerEntry } from "@lensjs/watchers";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({ /* ... */ });

// Recommendation: Create a wrapper function
async function sendEmail(payload) {
  const info = await transporter.sendMail(payload);

  // Log the entry to Lens
  // Arguments: transport name, payload, and the response info
  await logNodeMailerEntry('smtp', payload, info);

  return info;
}
```

</Step>
</Steps>

</template>
<template #Fastify>

<CommandCopy pkg="@lensjs/watchers" />

<Steps>
<Step title="Enable the Mail Watcher">

Set `mailWatcherEnabled: true` when registering the Lens plugin.

```ts
import Fastify from "fastify";
import { lens } from "@lensjs/fastify";

const fastify = Fastify();

await fastify.register(lens, {
  mailWatcherEnabled: true, // This enables the mail storage and UI
  // ... other config
});
```

</Step>
<Step title="Log Sent Emails">

In your route handlers or services, call `logNodeMailerEntry` after sending an email.

```ts
import { logNodeMailerEntry } from "@lensjs/watchers";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({ /* ... */ });

fastify.post("/send-welcome", async (request, reply) => {
  const payload = {
    from: "no-reply@example.com",
    to: "user@example.com",
    subject: "Welcome!",
    text: "Welcome to our app!",
  };

  const info = await transporter.sendMail(payload);

  // Log the entry to Lens
  await logNodeMailerEntry("smtp", payload, info);

  return { status: "ok" };
});
```

</Step>
</Steps>

</template>
<template #NestJS>

<CommandCopy pkg="@lensjs/watchers" />

<Steps>
<Step title="Enable the Mail Watcher">

Set `mailWatcherEnabled: true` in your `main.ts` Lens configuration.

```ts
// src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { lens } from "@lensjs/nestjs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await lens({
    app,
    mailWatcherEnabled: true, // This enables the mail storage and UI
  });

  await app.listen(3000);
}
bootstrap();
```

</Step>
<Step title="Log Sent Emails">

In your Mail service, call `logNodeMailerEntry` after the email is sent.

```ts
import { Injectable } from "@nestjs/common";
import { logNodeMailerEntry } from "@lensjs/watchers";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({ /* ... */ });

  async sendWelcomeEmail(user) {
    const payload = {
      from: 'no-reply@example.com',
      to: user.email,
      subject: 'Welcome to LensJS',
      html: '<b>Hello!</b>',
    };

    const info = await this.transporter.sendMail(payload);

    // Log the entry to Lens
    await logNodeMailerEntry('smtp', payload, info);

    return info;
  }
}
```

</Step>
</Steps>

</template>
<template #AdonisJS>

Lens captures AdonisJS mail **automatically** — you do **not** call `logNodeMailerEntry`.

<Callout type="info" title="Prerequisites">

- The `@lensjs/adonis` adapter installed and configured (see [AdonisJS Installation](/adapters/adonis/installation)).
- The [`@adonisjs/mail`](https://docs.adonisjs.com/guides/digging-deeper/mail) package installed and configured.

</Callout>

<Steps>
<Step title="Enable the Mail Watcher">

In `config/lens.ts`, set `mail` to `true` inside the `watchers` object:

```ts
// config/lens.ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  // ...
  watchers: {
    requests: env.get('LENS_ENABLE_REQUEST_WATCHER', true),
    cache: env.get('LENS_ENABLE_CACHE_WATCHER', false),
    exceptions: env.get('LENS_ENABLE_EXCEPTION_WATCHER', true),
    mail: env.get('LENS_ENABLE_MAIL_WATCHER', false), // [!code ++]
    queries: {
      enabled: env.get('LENS_ENABLE_QUERY_WATCHER', true),
      provider: 'sqlite',
    },
  },
})

export default lensConfig
```

Then enable it via your `.env` file:

```bash
LENS_ENABLE_MAIL_WATCHER=true
```

</Step>
<Step title="Send Mail As Usual">

No extra wiring is required. Send mail through AdonisJS Mail and Lens captures it:

```ts
import mail from '@adonisjs/mail/services/main'

await mail.send((message) => {
  message
    .to('user@example.com')
    .from('info@example.com')
    .subject('Welcome to AdonisJS')
    .html('<h1>Hello world</h1>')
})
```

<Callout type="note" title="Mail during ace commands">
Mail sent while running an ace command (migrations, seeders, tests) is ignored, except for the
long-running <code>queue:listen</code> and <code>schedule:work</code> commands — so mail dispatched
from a queue worker is still captured. When a mail is sent during an HTTP request, it is correlated
to that request and appears in the request's <strong>Emails</strong> tab.
</Callout>

</Step>
</Steps>

</template>
</CodeTabs>

## What gets captured

Every message — whether logged from Nodemailer or captured automatically in AdonisJS — is
translated into Lens's driver-agnostic mail record, so the dashboard renders them identically:

- **MIME tree** — HTML and text bodies grouped as `multipart/alternative`, with nested
  `multipart/related` (inline images) and `multipart/mixed` (attachments); `quoted-printable` and
  `base64` content is decoded automatically.
- **iCalendar events** — the `.ics` content from Nodemailer's `icalEvent` is captured and shown in
  a dedicated **Calendar** tab, with **Summary**, **Start/End** times, and **Location** parsed out.
- **Attachments** — extracted and listed separately with filename, content type, and disposition.
  In-memory content is stored and downloadable; file/stream attachments are listed by metadata only.
- **Raw EML** — when you send with Nodemailer's `raw` property, Lens parses the headers, decodes
  RFC 2047 encoded words (e.g. non-ASCII subjects), and shows a byte-perfect preview.
- **Recipients & headers** — `From`, `To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `Message-ID`,
  `Date`, and the SMTP envelope from the driver response.

## In the dashboard

Open the **Mail** tab to **search** emails by subject, **preview** the HTML/text body, **download**
the reconstructed `.eml` file, and **audit** recipients (To, Cc, Bcc) and headers. When an email is
sent during a request, it also appears in that request's **Emails** tab.

## Next steps

<CardGrid :cols="2">
  <Card icon="settings" title="Configuration" href="/configuration">
    Every Lens option — sampling, retention, redaction, and securing the dashboard.
  </Card>
  <Card icon="plug" title="All watchers" href="/watchers/">
    Explore every built-in watcher and install the ones you need.
  </Card>
</CardGrid>
