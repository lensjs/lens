import type { Mailbox, MailHeader, MimePart, MailEntry } from '@lensjs/core'
import { nowISO } from '@lensjs/date'

/**
 * A recipient as exposed by AdonisJS Mail / Nodemailer message objects.
 */
type AdonisAddress = string | { address: string; name?: string }

/**
 * The compiled node message object carried by the `@adonisjs/mail` `mail:sent` event.
 * Typed structurally so the adapter does not need `@adonisjs/mail` installed.
 */
export interface AdonisMailMessage {
  from?: AdonisAddress
  sender?: AdonisAddress
  to?: AdonisAddress | AdonisAddress[]
  cc?: AdonisAddress | AdonisAddress[]
  bcc?: AdonisAddress | AdonisAddress[]
  replyTo?: AdonisAddress | AdonisAddress[]
  subject?: string
  messageId?: string
  inReplyTo?: string
  references?: string | string[]
  priority?: 'high' | 'normal' | 'low'
  date?: Date | string
  html?: string
  text?: string
  watchHtml?: string
  headers?: Record<string, unknown> | Array<{ key: string; value: unknown }>
  attachments?: Array<{
    filename?: string
    contentType?: string
    cid?: string
    contentDisposition?: 'inline' | 'attachment'
    content?: unknown
    encoding?: string
  }>
}

/**
 * Payload shape of the `@adonisjs/mail` `mail:sent` event.
 */
export interface AdonisMailSentEvent {
  message: AdonisMailMessage
  mailerName?: string
  response?: {
    messageId?: string
    envelope?: { from?: string | false; to?: string[] }
  }
}

/**
 * Normalize AdonisJS/Nodemailer recipients (string or object, single or array)
 * into the neutral `Mailbox[]` shape used by `@lensjs/core`.
 */
export function toMailboxes(input?: AdonisAddress | AdonisAddress[]): Mailbox[] {
  if (!input) return []

  const list = Array.isArray(input) ? input : [input]

  return list
    .filter((address): address is AdonisAddress => !!address)
    .map((address) => {
      if (typeof address === 'string') return { address }

      return address.name
        ? { address: address.address, name: address.name }
        : { address: address.address }
    })
}

/**
 * Normalize message headers (object map or `{ key, value }[]`) into `MailHeader[]`.
 */
export function normalizeMailHeaders(input?: AdonisMailMessage['headers']): MailHeader[] {
  if (!input) return []

  if (Array.isArray(input)) {
    return input
      .filter((header) => header && header.key)
      .map((header) => ({ name: header.key, value: String(header.value ?? '') }))
  }

  const headers: MailHeader[] = []

  for (const name of Object.keys(input)) {
    const value = input[name]

    if (Array.isArray(value)) {
      value.forEach((entry) =>
        headers.push({
          name,
          value: typeof entry === 'string' ? entry : String((entry as any)?.value ?? ''),
        })
      )
    } else if (value && typeof value === 'object' && 'value' in value) {
      headers.push({ name, value: String((value as any).value) })
    } else {
      headers.push({ name, value: String(value) })
    }
  }

  return headers
}

function resolveBody(content: unknown): { body: string; transferEncoding?: string } | undefined {
  if (content === undefined || content === null) return undefined
  if (typeof content === 'string') return { body: content }
  if (Buffer.isBuffer(content)) {
    return { body: content.toString('base64'), transferEncoding: 'base64' }
  }
  // Path/stream/URL-based attachments are intentionally not read (avoid I/O + leaking files).
  return undefined
}

function bodySize(body: string | undefined, transferEncoding?: string): number {
  if (!body) return 0
  return Buffer.byteLength(body, transferEncoding === 'base64' ? 'base64' : 'utf8')
}

function leafPart(contentType: string, content: unknown): MimePart {
  const resolved = resolveBody(content)

  return {
    contentType,
    transferEncoding: resolved?.transferEncoding ?? 'quoted-printable',
    body: resolved?.body,
    size: bodySize(resolved?.body, resolved?.transferEncoding),
    headers: [],
  }
}

/**
 * Build a MIME tree from an AdonisJS mail message.
 * Mirrors the shape produced by the Nodemailer handler in `@lensjs/watchers`:
 * text/html become a `multipart/alternative`, attachments wrap everything in
 * `multipart/mixed`.
 */
export function buildMailMime(message: AdonisMailMessage): MimePart {
  const alternatives: MimePart[] = []

  if (message.text) alternatives.push(leafPart('text/plain', message.text))
  if (message.html) alternatives.push(leafPart('text/html', message.html))
  if (message.watchHtml) alternatives.push(leafPart('text/html', message.watchHtml))

  const rootParts: MimePart[] = []

  if (alternatives.length > 1) {
    rootParts.push({ contentType: 'multipart/alternative', headers: [], parts: alternatives })
  } else if (alternatives[0]) {
    rootParts.push(alternatives[0])
  }

  for (const attachment of message.attachments ?? []) {
    const resolved = resolveBody(attachment.content)

    rootParts.push({
      contentType: attachment.contentType || 'application/octet-stream',
      filename: attachment.filename,
      contentDisposition: attachment.contentDisposition ?? 'attachment',
      contentId: attachment.cid,
      transferEncoding: resolved?.transferEncoding ?? attachment.encoding,
      body: resolved?.body,
      size: bodySize(resolved?.body, resolved?.transferEncoding),
      headers: [],
    })
  }

  if (rootParts.length > 1) {
    return { contentType: 'multipart/mixed', headers: [], parts: rootParts }
  }

  return rootParts[0] ?? { contentType: 'text/plain', headers: [], body: '' }
}

function toIso(date?: Date | string): string {
  if (!date) return nowISO()

  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? nowISO() : parsed.toISOString()
}

/**
 * Translate an AdonisJS `mail:sent` event into the neutral `MailEntry` contract.
 */
export function buildMailEntry(event: AdonisMailSentEvent, requestId: string): MailEntry {
  const { message, response, mailerName } = event

  return {
    requestId,
    from: toMailboxes(message.from),
    sender: toMailboxes(message.sender)[0],
    to: toMailboxes(message.to),
    cc: toMailboxes(message.cc),
    bcc: toMailboxes(message.bcc),
    replyTo: toMailboxes(message.replyTo),
    subject: message.subject,
    messageId: message.messageId ?? response?.messageId,
    inReplyTo: message.inReplyTo,
    references: message.references,
    priority: message.priority,
    date: toIso(message.date),
    headers: normalizeMailHeaders(message.headers),
    mime: buildMailMime(message),
    envelope: {
      mailFrom: response?.envelope?.from || undefined,
      rcptTo: response?.envelope?.to,
    },
    meta: {
      driver: 'adonis',
      transport: mailerName,
      status: 'sent',
      sentAt: nowISO(),
    },
  }
}
