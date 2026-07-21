# AdonisJS Mail Watcher

Lens captures outgoing emails in AdonisJS **automatically** by listening to the `mail:sent`
event emitted by [`@adonisjs/mail`](https://docs.adonisjs.com/guides/digging-deeper/mail).
Unlike the Express/Fastify handlers, you do **not** need to call any logging function — just
enable the watcher and send mail as usual.

## Prerequisites

- The `@lensjs/adonis` adapter installed and configured (see
  [AdonisJS Installation](/adapters/adonis/installation)).
- The [`@adonisjs/mail`](https://docs.adonisjs.com/guides/digging-deeper/mail) package installed
  and configured.

## 1. Enable the Mail Watcher

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

## 2. Send Mail As Usual

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

> **Note:** Mail sent while running an ace command (migrations, seeders, tests) is ignored,
> except for the long-running `queue:listen` and `schedule:work` commands — so mail dispatched
> from a queue worker is still captured. When a mail is sent during an HTTP request, it is
> correlated to that request and appears in the request's **Emails** tab.

## What Gets Captured

The watcher translates each sent message into Lens's driver-agnostic mail record:

- **Recipients**: `From`, `To`, `Cc`, `Bcc`, and `Reply-To`.
- **Content**: HTML and text bodies, grouped into a MIME tree (`multipart/alternative`, and
  `multipart/mixed` when attachments are present).
- **Attachments**: filename, content type, and disposition (in-memory content is stored;
  file/stream attachments are listed by metadata only).
- **Headers**, `Subject`, `Message-ID`, `Date`, and the SMTP envelope from the driver response.

## UI Integration

In the Lens dashboard, open the **Mail** tab to:

- **Search** emails by subject.
- **View** a rich preview of the HTML/Text body.
- **Download** the reconstructed `.eml` file.
- **Audit** recipients (To, Cc, Bcc) and headers.
- **View related emails**: emails sent during a request appear in that request's detail view.
