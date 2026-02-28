# Nodemailer Reference Guide

> This document is structured for LLM consumption. Each section is self-contained with a clear purpose, key rules, and ready-to-use code examples.

---

## Table of Contents
1. [Attachments](#attachments)
2. [Embedded Images (CID)](#embedded-images-cid)
3. [Alternative Content Types](#alternative-content-types)
4. [Address Formats](#address-formats)
5. [List Headers (RFC 2369)](#list-headers-rfc-2369)
6. [Custom Headers](#custom-headers)
7. [Custom Raw Source](#custom-raw-source)

---

## Attachments

**Purpose:** Attach files or data to outgoing emails.

**Key property:** `attachments` — array of attachment objects inside the message object.

### Attachment Methods

| Method | Use Case | Required Properties |
|---|---|---|
| String content | Simple text data | `filename`, `content` (string) |
| Buffer content | Binary data in memory | `filename`, `content` (Buffer) |
| File path (streaming) | Large files on disk | `filename`, `path` |
| Path only | Auto-detect filename + MIME | `path` |
| Readable stream | Full read control | `filename`, `content` (stream) |
| Explicit MIME type | Override auto-detection | `filename`, `content`, `contentType` |
| Remote URL | Fetch content at send time | `filename`, `href` |
| Base64 string | Pre-encoded content | `filename`, `content`, `encoding: "base64"` |
| Data URI | Inline data or canvas | `path` (data URI string) |
| Raw MIME node | Full MIME control | `raw` (complete MIME string) |

```js
const fs = require("fs");

const message = {
  attachments: [
    // 1. String
    { filename: "hello.txt", content: "Hello world!" },

    // 2. Buffer
    { filename: "buffer.txt", content: Buffer.from("Hello world!", "utf8") },

    // 3. File path (streaming — memory-efficient for large files)
    { filename: "report.pdf", path: "/absolute/path/to/report.pdf" },

    // 4. Path only (filename and MIME type auto-detected from extension)
    { path: "/absolute/path/to/image.png" },

    // 5. Readable stream
    { filename: "notes.txt", content: fs.createReadStream("./notes.txt") },

    // 6. Explicit content type
    { filename: "data.bin", content: Buffer.from("deadbeef", "hex"), contentType: "application/octet-stream" },

    // 7. Remote URL (Nodemailer fetches at send time)
    { filename: "license.txt", href: "https://raw.githubusercontent.com/nodemailer/nodemailer/master/LICENSE" },

    // 8. Base64-encoded string
    { filename: "photo.jpg", content: "/9j/4AAQSkZJRgABAQAAAQABAAD...", encoding: "base64" },

    // 9. Data URI
    { path: "data:text/plain;base64,SGVsbG8gd29ybGQ=" },

    // 10. Pre-built MIME node (full control over MIME structure)
    {
      raw: [
        "Content-Type: text/plain; charset=utf-8",
        'Content-Disposition: attachment; filename="greeting.txt"',
        "",
        "Hello world!"
      ].join("\r\n"),
    },
  ],
};
```

---

## Embedded Images (CID)

**Purpose:** Embed images directly inside the HTML body using Content-ID references.

**How it works:**
1. Add image to `attachments` with a `cid` property.
2. Reference the `cid` in the HTML `src` attribute as `cid:<value>`.

> Each embedded image needs a **unique** `cid` value.

```js
// Single embedded image
const message = {
  from: "Alice <alice@example.com>",
  to: "Bob <bob@example.com>",
  subject: "Inline image test",
  html: 'Embedded image: <img src="cid:logo@example.com" alt="Company logo"/>',
  attachments: [
    { filename: "logo.png", path: "/path/to/logo.png", cid: "logo@example.com" },
  ],
};

// Using a Buffer instead of a file path
const messageWithBuffer = {
  html: '<img src="cid:screenshot@example.com" alt="Screenshot"/>',
  attachments: [
    {
      filename: "screenshot.png",
      content: fs.readFileSync("/tmp/screenshot.png"), // Buffer
      cid: "screenshot@example.com",
    },
  ],
};

// Multiple embedded images
const messageMultiple = {
  html: `
    <img src="cid:chart@example.com" alt="Sales chart"/>
    <img src="cid:badge@example.com" alt="Achievement badge"/>
  `,
  attachments: [
    { filename: "chart.png", path: "./chart.png", cid: "chart@example.com" },
    { filename: "badge.png", path: "./badge.png", cid: "badge@example.com" },
  ],
};
```

---

## Alternative Content Types

**Purpose:** Provide additional representations of the message body (e.g., Markdown, custom MIME types) alongside the primary HTML/text body.

**Key property:** `alternatives` — array of alternative content objects.

```js
const message = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Hello",
  html: "<b>Hello world!</b>",
  alternatives: [
    {
      contentType: "text/x-web-markdown",
      content: "**Hello world!**",
    },
  ],
};
```

---

## Address Formats

**Purpose:** Specify senders and recipients in `from`, `to`, `cc`, `bcc`, and `reply-to` fields.

**Supported formats:**
- Plain email string: `"user@example.com"`
- Formatted string: `'"Display Name" <user@example.com>'`
- Comma-separated string (multiple recipients)
- Array of strings or address objects `{ name, address }`
- Mixed arrays combining strings and objects

```js
const message = {
  // Formatted single address
  from: '"Example Sender" <sender@example.com>',

  // Comma-separated string with multiple recipients
  to: 'foobar@example.com, "Ноде Майлер" <bar@example.com>, "Name, User" <baz@example.com>',

  // Array of address strings
  cc: [
    "first@example.com",
    '"Ноде Майлер" <second@example.com>',
    '"Name, User" <third@example.com>',
  ],

  // Mixed array: strings and address objects
  bcc: [
    "hidden@example.com",
    { name: "Майлер, Ноде", address: "another@example.com" },
  ],
};
```

---

## List Headers (RFC 2369)

**Purpose:** Add standard mailing list headers (`List-Help`, `List-Unsubscribe`, etc.) that email clients use to display actions like "Unsubscribe" buttons.

**Key property:** `list` — object where each key maps to a `List-*` header (case-insensitive).

### Value Format Rules

| Value Type | Result |
|---|---|
| `string` | Single URL, auto-wrapped in `<...>` |
| `{ url, comment }` | URL with optional human-readable comment |
| `Array<string \| { url, comment }>` | Multiple separate header lines for the same type |
| `Array<Array<...>>` (nested) | Multiple URLs in a **single** header line, comma-separated |

**URL auto-formatting:**
- Email addresses → `<mailto:address>`
- `http/https/mailto/ftp` URLs → wrapped in `<...>` as-is
- Other strings → treated as domains, prefixed with `http://`

```js
await transporter.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "List Message",
  text: "I hope no one unsubscribes from this list!",
  list: {
    // List-Help: <mailto:admin@example.com?subject=help>
    help: "admin@example.com?subject=help",

    // List-Unsubscribe: <http://example.com> (Comment)
    unsubscribe: { url: "http://example.com", comment: "Comment" },

    // Two separate List-Subscribe header lines
    subscribe: [
      "admin@example.com?subject=subscribe",
      { url: "http://example.com", comment: "Subscribe" },
    ],

    // Multiple URLs in a single List-Post header line
    post: [
      [
        "http://example.com/post",
        { url: "admin@example.com?subject=post", comment: "Post" },
      ],
    ],
  },
});

/*
Resulting headers:
List-Help: <mailto:admin@example.com?subject=help>
List-Unsubscribe: <http://example.com> (Comment)
List-Subscribe: <mailto:admin@example.com?subject=subscribe>
List-Subscribe: <http://example.com> (Subscribe)
List-Post: <http://example.com/post>, <mailto:admin@example.com?subject=post> (Post)
*/
```

---

## Custom Headers

**Purpose:** Add custom headers or override defaults. Works at the message level and on individual attachments/alternatives.

**Key property:** `headers` — object of key-value pairs.

### Rules
- Keys are auto-converted to standard capitalized form (`x-my-key` → `X-My-Key`).
- Values are auto-encoded for non-ASCII and wrapped at 78 characters.
- Use `prepared: true` to bypass encoding/folding.
- ⚠️ **Do NOT set protected headers** (`From`, `To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `Message-ID`, `Date`, etc.) via `headers`. Use dedicated message properties instead.

```js
const message = {
  // 1. Simple custom headers
  headers: {
    "x-my-key": "header value",
    "x-another-key": "another value",
  },
  // Result:
  // X-My-Key: header value
  // X-Another-Key: another value
};

// 2. Repeated header (same key, multiple values)
const messageRepeated = {
  headers: {
    "x-my-key": ["value for row 1", "value for row 2", "value for row 3"],
  },
  // Result:
  // X-My-Key: value for row 1
  // X-My-Key: value for row 2
  // X-My-Key: value for row 3
};

// 3. Bypass encoding (prepared: true)
const messageRaw = {
  headers: {
    "x-processed": "a really long header or value with non-ascii characters",
    "x-unprocessed": {
      prepared: true, // sent exactly as-is, no encoding or line wrapping
      value: "a really long header or value with non-ascii characters",
    },
  },
};

// 4. Custom headers on an individual attachment
const messageAttachmentHeaders = {
  attachments: [
    {
      filename: "report.csv",
      content: csvBuffer,
      headers: {
        "x-report-id": "2025-Q1",
      },
    },
  ],
};
```

---

## Custom Raw Source

**Purpose:** Send a pre-built RFC 822/EML message without Nodemailer modifying its structure. Useful when a message was generated by another system, retrieved from storage, or built with Mailcomposer/MailParser.

**Key property:** `raw` — can be used at three levels:
1. **Whole message** — complete RFC 822 document with headers and body.
2. **Per alternative** — pre-built MIME part for an alternative content type.
3. **Per attachment** — complete MIME attachment including headers.

> ⚠️ **When using `raw` for the entire message, always set `envelope.from` and `envelope.to` explicitly.** Nodemailer does not parse these from the raw content.

```js
// 1. String as entire message
const message = {
  envelope: {
    from: "sender@example.com",
    to: ["recipient@example.com"],
  },
  raw: `From: sender@example.com\r\nTo: recipient@example.com\r\nSubject: Hello world\r\n\r\nHello world!`,
  // Note: use \r\n line endings if your mail server requires RFC 5321 compliance
};

// 2. EML file as entire message
const messageFromFile = {
  envelope: {
    from: "sender@example.com",
    to: ["recipient@example.com"],
  },
  raw: {
    path: "/path/to/message.eml", // absolute or relative to process.cwd()
  },
};

// 3. Raw MIME string as an attachment
// Must include all MIME headers manually — Nodemailer adds none automatically
const messageRawAttachment = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Custom attachment",
  attachments: [
    {
      raw: `Content-Type: text/plain\r\nContent-Disposition: attachment; filename="notes.txt"\r\n\r\nAttached text file`,
    },
  ],
};
```
