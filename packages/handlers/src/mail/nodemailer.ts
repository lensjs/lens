import { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import addressParser from "nodemailer/lib/addressparser";
import { Readable } from "stream";
import fs from "fs";
import {
  Mailbox,
  MailEntry,
  MailHeader,
  MimePart,
  lensEmitter,
  lensContext,
} from "@lensjs/core";
import { AttachmentLike } from "nodemailer/lib/mailer";

// Nodemailer transporter type
type NodeMailerTransporter = Transporter<
  SMTPTransport.SentMessageInfo,
  SMTPTransport.Options
>;
type AddressInput =
  | string
  | { name?: string; address: string }
  | Array<string | { name?: string; address: string }>
  | null
  | undefined;

// ── Helpers ────────────────────────────────────────────────────────────────
export function normalizeAddresses(input: AddressInput): Mailbox[] {
  if (!input) return [];
  let inputString: string;

  if (Array.isArray(input)) {
    inputString = input
      .map((addr) =>
        typeof addr === "string"
          ? addr
          : `"${addr.name ?? ""}" <${addr.address}>`,
      )
      .join(", ");
  } else if (typeof input === "object") {
    inputString = `"${input.name ?? ""}" <${input.address}>`;
  } else {
    inputString = input;
  }

  const parsed = addressParser(inputString, { flatten: true });
  return parsed.map((addr) => ({ name: addr.name, address: addr.address }));
}

export function parseStatus(code: number): "sent" | "failed" {
  return code >= 200 && code < 300 ? "sent" : "failed";
}

type ResolveContentParam =
  | string
  | Buffer
  | Readable
  | (AttachmentLike & {
      path?: string | { href: string };
      href?: string;
      encoding?: string;
    })
  | undefined;

/**
 * Resolves content to a string format representable in text-based storage (like SQLite).
 * If the source is binary (Buffer, Stream, File), it returns a base64 encoded string
 * and includes transferEncoding: "base64" in the result.
 */
export async function resolveContent(
  content: ResolveContentParam,
): Promise<{ body: string; transferEncoding?: string } | undefined> {
  if (content === undefined) return undefined;

  if (typeof content === "string") return { body: content };

  if (Buffer.isBuffer(content)) {
    return { body: content.toString("base64"), transferEncoding: "base64" };
  }

  if (content instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of content) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return {
      body: Buffer.concat(chunks).toString("base64"),
      transferEncoding: "base64",
    };
  }

  if (typeof content === "object" && !Buffer.isBuffer(content)) {
    // 1. If explicit content exists, use it
    if ("content" in content && content.content !== undefined) {
      const resolved = await resolveContent(
        content.content as ResolveContentParam,
      );

      // If the parent object explicitly requested base64 encoding
      if (resolved && "encoding" in content && content.encoding === "base64") {
        return { body: resolved.body, transferEncoding: "base64" };
      }
      return resolved;
    }

    // 2. If path or URL exists, fetch/read it
    const path =
      ("path" in content && typeof content.path === "string"
        ? content.path
        : "path" in content &&
            typeof content.path === "object" &&
            content.path &&
            "href" in content.path
          ? (content.path as any).href
          : undefined) ||
      ("href" in content ? (content as any).href : undefined);

    if (path && typeof path === "string") {
      if (path.startsWith("data:")) {
        const [meta, data] = path.split(",");
        if (data) {
          const isBase64 = meta?.includes("base64");
          return {
            body: isBase64 ? data : decodeURIComponent(data),
            transferEncoding: isBase64 ? "base64" : undefined,
          };
        }
        return undefined;
      }

      if (path.startsWith("http://") || path.startsWith("https://")) {
        const res = await fetch(path);
        const arrayBuffer = await res.arrayBuffer();
        return {
          body: Buffer.from(arrayBuffer).toString("base64"),
          transferEncoding: "base64",
        };
      }
      const buffer = await fs.promises.readFile(path);
      return { body: buffer.toString("base64"), transferEncoding: "base64" };
    }
  }

  return undefined;
}

// ── List Headers ─────────────────────────────────────────────────────────────
export function normalizeListHeaders(input: any): MailHeader[] {
  if (!input || typeof input !== "object") return [];

  const headers: MailHeader[] = [];

  for (const key of Object.keys(input)) {
    const headerName = `List-${key.charAt(0).toUpperCase()}${key.slice(1).toLowerCase()}`;
    const values = Array.isArray(input[key]) ? input[key] : [input[key]];

    for (const val of values) {
      if (Array.isArray(val)) {
        // Nested array -> single header with multiple comma-separated URLs
        const joined = val.map((v) => formatListUrl(v)).join(", ");
        headers.push({ name: headerName, value: joined });
      } else {
        headers.push({ name: headerName, value: formatListUrl(val) });
      }
    }
  }

  return headers;
}

function formatListUrl(val: any): string {
  let url = typeof val === "string" ? val : val.url;
  const comment =
    typeof val === "object" && val.comment ? ` (${val.comment})` : "";

  if (url.includes("@") && !url.includes("://") && !url.startsWith("mailto:")) {
    url = `mailto:${url}`;
  } else if (!url.includes("://") && !url.startsWith("mailto:")) {
    url = `http://${url}`;
  }

  return `<${url}>${comment}`;
}

/**
 * Decodes RFC 2047 encoded-words (e.g., =?utf-8?B?...?= or =?utf-8?Q?...?=)
 */
export function decodeRFC2047(text: string): string {
  return text.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (_, charset, encoding, data) => {
    if (encoding.toUpperCase() === "B") {
      // Base64
      try {
        const bin = Buffer.from(data, "base64");
        return new TextDecoder(charset).decode(bin);
      } catch (e) {
        return data;
      }
    } else {
      // Quoted-Printable
      const decoded = data
        .replace(/_/g, " ")
        .replace(/=([0-9A-F]{2})/gi, (__: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        );
      try {
        return new TextDecoder(charset).decode(
          Uint8Array.from([...decoded].map((c) => c.charCodeAt(0))),
        );
      } catch (e) {
        return decoded;
      }
    }
  });
}

// ── Raw EML Parsing ──────────────────────────────────────────────────────────
export function parseRawHeaders(raw: string | Buffer): MailHeader[] {
  const content = raw.toString();
  const headerSection = content.split(/\r?\n\r?\n/)[0];
  if (!headerSection) return [];

  const lines = headerSection.split(/\r?\n/);
  const headers: MailHeader[] = [];
  let currentHeader: MailHeader | null = null;

  for (const line of lines) {
    if (/^\s/.test(line) && currentHeader) {
      // Line folding
      currentHeader.value += " " + line.trim();
    } else {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match && match[1] && match[2] !== undefined) {
        currentHeader = {
          name: match[1],
          value: decodeRFC2047(match[2]),
        };
        headers.push(currentHeader);
      }
    }
  }
  return headers;
}

function getHeader(headers: MailHeader[], name: string): string | undefined {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
    ?.value;
}

// ── Build MimePart tree ─────────────────────────────────────────────────────
export async function buildMimeParts(options: any): Promise<MimePart> {
  // ── 0. Handle Top-level RAW ───────────────────────────────────────────────
  if (options.raw) {
    const resolved = await resolveContent(options.raw);
    let body = resolved?.body || "";

    // EML files are text-based; if it was read as a buffer, decode it so we can parse headers
    if (resolved?.transferEncoding === "base64") {
      body = Buffer.from(body, "base64").toString("utf-8");
    }

    const headers = parseRawHeaders(body);
    const contentType = getHeader(headers, "Content-Type") || "message/rfc822";

    return {
      contentType,
      body,
      headers,
    };
  }

  const rootParts: MimePart[] = [];
  const alternatives: MimePart[] = [];

  // text
  if (options.text) {
    const resolved = await resolveContent(options.text);
    alternatives.push({
      contentType: "text/plain",
      transferEncoding:
        resolved?.transferEncoding ||
        options.textEncoding ||
        "quoted-printable",
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  // html
  if (options.html) {
    const resolved = await resolveContent(options.html);
    alternatives.push({
      contentType: "text/html",
      transferEncoding:
        resolved?.transferEncoding ||
        options.textEncoding ||
        "quoted-printable",
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  // watchHtml
  if (options.watchHtml) {
    const resolved = await resolveContent(options.watchHtml);
    alternatives.push({
      contentType: "text/html",
      transferEncoding:
        resolved?.transferEncoding ||
        options.textEncoding ||
        "quoted-printable",
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  // AMP
  if (options.amp) {
    const resolved = await resolveContent(options.amp.raw || options.amp);
    alternatives.push({
      contentType: "text/x-amp-html",
      transferEncoding: resolved?.transferEncoding,
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  // iCal
  if (options.icalEvent) {
    const resolved = await resolveContent(
      options.icalEvent.raw || options.icalEvent,
    );
    alternatives.push({
      contentType: "text/calendar",
      transferEncoding: resolved?.transferEncoding,
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  // custom alternatives
  if (options.alternatives && Array.isArray(options.alternatives)) {
    for (const a of options.alternatives) {
      const resolved = await resolveContent(a.raw || a);
      alternatives.push({
        contentType: a.contentType || "application/octet-stream",
        transferEncoding:
          resolved?.transferEncoding || a.contentTransferEncoding || "base64",
        filename: a.filename,
        body: resolved?.body,
        size: resolved?.body
          ? Buffer.byteLength(
              resolved.body,
              resolved.transferEncoding === "base64" ? "base64" : "utf8",
            )
          : 0,
        headers: [],
      });
    }
  }

  if (alternatives.length > 1) {
    rootParts.push({
      contentType: "multipart/alternative",
      headers: [],
      parts: alternatives,
    });
  } else if (alternatives.length === 1) {
    rootParts.push(alternatives[0] as MimePart);
  }

  // ── 2. Attachments ────────────────────────────────────────────────────────
  const attachments = options.attachments || [];
  for (const a of attachments) {
    const resolved = await resolveContent(a.raw || a);
    rootParts.push({
      contentType: a.contentType || "application/octet-stream",
      filename: a.filename,
      contentDisposition: a.contentDisposition ?? "attachment",
      contentId: a.cid,
      transferEncoding:
        resolved?.transferEncoding || a.contentTransferEncoding || "base64",
      body: resolved?.body,
      size: resolved?.body
        ? Buffer.byteLength(
            resolved.body,
            resolved.transferEncoding === "base64" ? "base64" : "utf8",
          )
        : 0,
      headers: [],
    });
  }

  if (rootParts.length > 1) {
    return {
      contentType: "multipart/mixed",
      headers: [],
      parts: rootParts,
    };
  }

  return rootParts[0] || { contentType: "text/plain", headers: [], body: "" };
}

export function normalizeHeaders(input: any): MailHeader[] {
  if (!input) return [];

  const result: MailHeader[] = [];

  if (Array.isArray(input)) {
    for (const h of input) {
      result.push({ name: h.key, value: h.value.toString() });
    }
  } else if (typeof input === "object") {
    for (const key of Object.keys(input)) {
      const value = input[key];

      if (Array.isArray(value)) {
        value.forEach((v) =>
          result.push({
            name: key,
            value: typeof v === "string" ? v : v.value,
          }),
        );
      } else if (
        typeof value === "object" &&
        "prepared" in value &&
        "value" in value
      ) {
        result.push({ name: key, value: value.value });
      } else {
        result.push({ name: key, value: value.toString() });
      }
    }
  }

  return result;
}

export async function logNodeMailerEntry<T extends NodeMailerTransporter>(
  transport: string,
  payload: Parameters<T["sendMail"]>[0],
  message: SMTPTransport.SentMessageInfo,
) {
  const mime = await buildMimeParts(payload);

  const rawHeaders = mime.headers || [];
  const payloadHeaders = [
    ...normalizeHeaders(payload.headers),
    ...normalizeListHeaders(payload.list),
  ];

  const headers = rawHeaders.length > 0 ? rawHeaders : payloadHeaders;

  const entry: MailEntry = {
    requestId: lensContext.getStore()?.requestId ?? "",
    from:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "From"))
        : normalizeAddresses(payload.from),
    sender:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "Sender"))[0]
        : normalizeAddresses(payload.sender)[0],
    to:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "To"))
        : normalizeAddresses(payload.to),
    cc:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "Cc"))
        : normalizeAddresses(payload.cc),
    bcc:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "Bcc"))
        : normalizeAddresses(payload.bcc),
    replyTo:
      rawHeaders.length > 0
        ? normalizeAddresses(getHeader(rawHeaders, "Reply-To"))
        : normalizeAddresses(payload.replyTo),
    subject:
      rawHeaders.length > 0
        ? getHeader(rawHeaders, "Subject")
        : payload.subject,
    messageId:
      (rawHeaders.length > 0
        ? getHeader(rawHeaders, "Message-ID")
        : payload.messageId) ?? message.messageId,
    references:
      rawHeaders.length > 0
        ? getHeader(rawHeaders, "References")
        : payload.references,
    date:
      rawHeaders.length > 0 && getHeader(rawHeaders, "Date")
        ? new Date(getHeader(rawHeaders, "Date") as string).toISOString()
        : payload.date
          ? new Date(payload.date).toISOString()
          : new Date().toISOString(),
    priority: (rawHeaders.length > 0
      ? getHeader(rawHeaders, "Priority")
      : payload.priority) as any,
    headers,
    mime: {
      ...mime,
      //@ts-ignore
      size: message.messageSize || mime.size,
    },
    envelope: {
      mailFrom: message.envelope?.from || undefined,
      rcptTo: message.envelope?.to,
    },
    raw: (await resolveContent(payload.raw)) as any,
    meta: {
      driver: "nodemailer",
      transport,
      status: parseStatus(parseInt(message.response.split(" ")[0] as string)),
      //@ts-ignore
      durationMs: message.envelopeTime ?? message.messageTime,
      driverResponse: null,
      sentAt: new Date().toISOString(),
    },
  };

  lensEmitter.emit("mail", entry);
}
