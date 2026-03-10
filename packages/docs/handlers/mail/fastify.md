# Fastify Mail Watcher Handler

This guide covers how to integrate the Lens Mail Watcher into your **Fastify** application.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## Usage Example (Fastify + Nodemailer)

### 1. Enable the Mail Watcher
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

### 2. Log Sent Emails
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

## Features

The Fastify integration supports:
- **Automatic Request Linking**: Emails sent within a request handler are automatically associated with that specific request in the Lens UI.
- **Full MIME Tree Support**: Capture HTML, text, attachments, and inline images.
- **iCalendar Integration**: View meeting details and download `.ics` files directly from the dashboard.
- **Modern Dark UI**: A sleek, dark-themed dashboard for auditing all outgoing communications.
