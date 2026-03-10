/**
 * LensJS — Mail Watcher Contract
 *
 * Driver-agnostic. Works with Nodemailer, Resend, SES, SendGrid, SMTP, etc.
 * Contains everything needed to reconstruct a valid RFC 5322 .eml file
 */

// ─────────────────────────────────────────────────────────────────────────────
// RFC-level primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single email address with an optional display name.
 * Serializes to: "Display Name <user@example.com>" or "user@example.com"
 */
export interface Mailbox {
  address: string; // RFC 5321 addr-spec
  name?: string; // RFC 5322 display-name
}

/**
 * A single RFC 5322 header field.
 *
 * Using a structured type (vs Record<string, string>) preserves:
 *  - Header ordering (critical for DKIM, Received chains, etc.)
 *  - Duplicate headers (e.g. multiple "Received:" lines)
 *  - Original casing (RFC 5322 is case-insensitive but real-world parsers vary)
 */
export interface MailHeader {
  name: string; // Case-preserving header name, e.g. "Content-Type"
  value: string; // Unfolded (whitespace-normalized) value
  raw?: string; // Original raw header line(s) as received, if available
}

// ─────────────────────────────────────────────────────────────────────────────
// SMTP Envelope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SMTP envelope — separate from message headers.
 * These are the MAIL FROM / RCPT TO values negotiated at the SMTP level,
 * which may differ from the From:/To: headers in the message itself.
 */
export interface MailEnvelope {
  mailFrom?: string; // SMTP MAIL FROM addr-spec (no display name)
  rcptTo?: string[]; // SMTP RCPT TO addr-specs (no display names)
}

// ─────────────────────────────────────────────────────────────────────────────
// MIME Tree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single node in the MIME tree.
 *
 * Leaf nodes (text/plain, text/html, image/png, etc.) carry a `body`.
 * Multipart nodes (multipart/mixed, multipart/alternative, etc.) carry `parts`.
 *
 * Typical tree shapes:
 *
 * Plain text only:
 *   text/plain
 *
 * HTML + plain fallback:
 *   multipart/alternative
 *     text/plain
 *     text/html
 *
 * HTML + inline images:
 *   multipart/related
 *     multipart/alternative
 *       text/plain
 *       text/html
 *     image/png  (Content-ID: <cid@domain>)
 *
 * With attachments:
 *   multipart/mixed
 *     multipart/related
 *       multipart/alternative
 *         text/plain
 *         text/html
 *       image/png
 *     application/pdf  (Content-Disposition: attachment)
 */
export interface MimePart {
  /** Full MIME content-type, e.g. "multipart/alternative", "text/html" */
  contentType: string;

  /** Content-Disposition value for this part */
  contentDisposition?: "inline" | "attachment";

  /** Charset parameter, e.g. "UTF-8" (leaf text parts) */
  charset?: string;

  /** Content-Transfer-Encoding, e.g. "base64", "quoted-printable", "7bit" */
  transferEncoding?: string;

  /** Attachment/inline filename (Content-Disposition filename param) */
  filename?: string;

  /**
   * Content-ID for CID-embedded inline content.
   * Format: "<unique-id@domain>"
   * Referenced in HTML as: src="cid:unique-id@domain"
   */
  contentId?: string;

  /**
   * Decoded body for leaf nodes. Undefined on multipart nodes.
   * If transferEncoding is "base64", this string is base64 encoded.
   */
  body?: string;

  /** Size in bytes of the decoded body */
  size?: number;

  /** Headers belonging to this specific MIME part */
  headers: MailHeader[];

  /** Child parts — populated only for multipart/* content types */
  parts?: MimePart[];
}

/**
 * Structured content container for the raw EML source.
 */
export interface MailRawSource {
  /** The actual EML content string */
  body: string;
  /** Encoding of the body string (e.g., "base64" if binary, or undefined/empty for plain text) */
  transferEncoding?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LensJS Watcher Metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LensJS-specific runtime metadata about how and when a message was sent.
 * Entirely separate from RFC headers — never serialized into .eml.
 */
export interface MailMeta {
  /** The driver that sent the message: "nodemailer" | "resend" | "ses" | "sendgrid" | etc. */
  driver: string;

  /**
   * The transport mechanism used by the driver.
   * "smtp" | "api" | "sendmail" | "queue" | "stream"
   */
  transport?: string;

  /** Delivery state */
  status: "pending" | "sent" | "failed";

  /** Failure reason — populated when status is "failed" */
  error?: string;

  /**
   * ISO 8601 timestamp of when the driver accepted/sent the message.
   * Distinct from the RFC 5322 "Date:" header, which is composition time.
   */
  sentAt?: string;

  /**
   * How long the send operation took, in milliseconds.
   * Useful for spotting slow SMTP servers or API latency in the Lens UI.
   */
  durationMs?: number;

  /**
   * Raw response from the driver (shape varies per driver).
   * e.g. Nodemailer's SentMessageInfo, Resend's CreateEmailResponse
   */
  driverResponse?: unknown;

  /**
   * App-defined tags for Lens UI filtering and grouping.
   * e.g. ["transactional", "welcome", "order-confirm"]
   */
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mail Entry — the top-level stored record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete, stored mail record in LensJS.
 *
 * Contains everything needed to:
 *  - Reconstruct a valid RFC 5322 .eml file
 *  - Display a rich mail detail view in the Lens UI
 *  - Filter, search, and audit sent mail
 */
export interface MailEntry {
  /** LensJS internal UUID for this requet id */
  requestId: string;

  // ── Routing (RFC 5322 §3.6.2 – §3.6.3) ─────────────────────────────────

  /** "From:" header — who composed the message */
  from: Mailbox[];

  /**
   * "Sender:" header — the actual submitting agent.
   * Required by RFC 5322 §3.6.2 when `from` contains multiple addresses.
   */
  sender?: Mailbox;

  /** "To:" header — primary recipients */
  to: Mailbox[];

  /** "Cc:" header — carbon copy recipients */
  cc?: Mailbox[];

  /**
   * "Bcc:" header — blind carbon copy recipients.
   *
   * ⚠️  MUST NOT be serialized into the .eml header block.
   * Stored here for LensJS audit/display purposes only.
   */
  bcc?: Mailbox[];

  /** "Reply-To:" header — where replies should be directed */
  replyTo?: Mailbox[];

  // ── Identification (RFC 5322 §3.6.4) ────────────────────────────────────

  /**
   * "Message-ID:" header.
   * Format: "<local-part@domain>"
   * Generated by the driver or LensJS if absent.
   */
  messageId?: string;

  /**
   * "In-Reply-To:" header.
   * Message-ID of the message being replied to.
   */
  inReplyTo?: string;

  /**
   * "References:" header.
   * Ordered list of Message-IDs forming the thread chain.
   * Serializes as a single space-separated string.
   */
  references?: string | string[];

  // ── Informational (RFC 5322 §3.6.5 – §3.6.7) ────────────────────────────

  /** "Subject:" header */
  subject?: string;

  /**
   * "Date:" header — when the message was composed/submitted.
   * ISO 8601 string. Serializes to RFC 2822 format: "Tue, 17 Feb 2026 10:30:00 +0000"
   */
  date?: string;

  /**
   * Message priority.
   * Maps to both "X-Priority" (1=high, 3=normal, 5=low) and "Importance:" headers.
   */
  priority?: "high" | "normal" | "low";

  // ── Headers ──────────────────────────────────────────────────────────────

  /**
   * All message-level headers, in order, including duplicates.
   * Preserves casing and ordering — essential for DKIM validation
   * and faithful .eml reconstruction.
   *
   * The typed fields above (subject, date, messageId, etc.) are
   * derived from these for convenience. This array is the source of truth.
   */
  headers: MailHeader[];

  // ── MIME Body ────────────────────────────────────────────────────────────

  /**
   * The full MIME tree of the message.
   * The root part's contentType drives the overall message structure
   * (text/plain, multipart/alternative, multipart/mixed, etc.).
   */
  mime: MimePart;

  // ── SMTP Envelope ────────────────────────────────────────────────────────

  /**
   * SMTP-level envelope (MAIL FROM / RCPT TO).
   * May differ from the From:/To: message headers.
   * Populated by the driver after handoff.
   */
  envelope?: MailEnvelope;

  // ── Raw Source ───────────────────────────────────────────────────────────

  /**
   * The full RFC 822 raw message source, if available.
   * Having this means you can always serve a byte-perfect .eml download
   * without needing to re-serialize from the parsed fields.
   */
  raw?: MailRawSource;

  // ── LensJS Metadata ──────────────────────────────────────────────────────

  /** LensJS watcher metadata — never serialized into .eml */
  meta: MailMeta;
}
