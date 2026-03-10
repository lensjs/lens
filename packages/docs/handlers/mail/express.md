# Nodemailer Mail Watcher Handler

Lens provides a built-in utility to monitor and capture outgoing emails sent via **Nodemailer**. This guide covers how to enable the mail watcher and log your emails correctly.

## Prerequisites

Ensure you have installed the `@lensjs/watchers` package:

```bash
npm install @lensjs/watchers
```

## Usage Example (Express + Nodemailer)

To enable mail monitoring, follow these two steps:

### 1. Enable the Mail Watcher
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

### 2. Log Sent Emails
Since emails are sent via external drivers, you need to call `logNodeMailerEntry` after a successful `sendMail` call.

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

## Supported Features

The Nodemailer handler is highly robust and captures nearly every detail of your outgoing mail:

### 1. MIME Tree Reconstruction
Lens automatically translates the Nodemailer payload into a standardized MIME tree. This includes:
- **HTML & Text versions**: Automatically grouped as alternatives.
- **Nested Multiparts**: Support for `multipart/related` (inline images) and `multipart/mixed` (attachments).
- **Encoding Support**: Handles `quoted-printable` and `base64` content automatically.

### 2. iCalendar Events
If you use the `icalEvent` property in Nodemailer, Lens will:
- Capture the `.ics` content.
- Display a dedicated **Calendar** tab in the UI.
- Parse key event details like **Summary**, **Start/End Times**, and **Location**.

### 3. Attachments
All attachments are extracted and listed separately in the Lens UI. You can download individual files directly from the mail detail view.

### 4. Raw EML Support
If you send emails using the `raw` property (passing a full EML string or file path), Lens will:
- Parse the raw headers (Subject, From, To, etc.).
- Decode RFC 2047 encoded words (e.g., Arabic or non-ASCII subjects).
- Provide a "byte-perfect" preview of the content.

## UI Integration

In the Lens dashboard, you will find a **Mail** tab where you can:
- **Search** emails by subject.
- **View** a rich preview of the HTML/Text body.
- **Download** the reconstructed `.eml` file.
- **Audit** recipients (To, Cc, Bcc) and headers.
- **View related emails**: If an email is sent during a request, it will appear in a dedicated "Emails" tab inside that request's detail view.
