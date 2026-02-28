# NestJS Mail Watcher Handler

This guide covers how to integrate the Lens Mail Watcher into your **NestJS** application.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## Usage Example (NestJS + Nodemailer)

### 1. Enable the Mail Watcher
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

### 2. Log Sent Emails
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

## Features

The NestJS integration supports all the standard features:
- **Automatic Association**: Emails sent during an active HTTP request are automatically linked to that request in the UI.
- **Rich MIME Preview**: View HTML/Text versions and nested MIME structures.
- **iCalendar Support**: Dedicated UI for meeting invitations.
- **Permanent Dark Mode**: A professional, dark-themed interface.
