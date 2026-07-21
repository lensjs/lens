import { test } from '@japa/runner'
import {
  buildMailEntry,
  buildMailMime,
  normalizeMailHeaders,
  toMailboxes,
  type AdonisMailSentEvent,
} from '../src/mail.js'

test.group('toMailboxes', () => {
  test('returns an empty array for empty input', ({ assert }) => {
    assert.deepEqual(toMailboxes(undefined), [])
    assert.deepEqual(toMailboxes([]), [])
  })

  test('normalizes a plain string address', ({ assert }) => {
    assert.deepEqual(toMailboxes('john@example.com'), [{ address: 'john@example.com' }])
  })

  test('normalizes an object address with a name', ({ assert }) => {
    assert.deepEqual(toMailboxes({ address: 'john@example.com', name: 'John' }), [
      { address: 'john@example.com', name: 'John' },
    ])
  })

  test('normalizes a mixed array of addresses', ({ assert }) => {
    assert.deepEqual(
      toMailboxes(['a@example.com', { address: 'b@example.com', name: 'B' }]),
      [{ address: 'a@example.com' }, { address: 'b@example.com', name: 'B' }]
    )
  })
})

test.group('normalizeMailHeaders', () => {
  test('returns an empty array for empty input', ({ assert }) => {
    assert.deepEqual(normalizeMailHeaders(undefined), [])
  })

  test('normalizes an object header map', ({ assert }) => {
    assert.deepEqual(normalizeMailHeaders({ 'X-Custom': 'value' }), [
      { name: 'X-Custom', value: 'value' },
    ])
  })

  test('normalizes an array of key/value headers', ({ assert }) => {
    assert.deepEqual(normalizeMailHeaders([{ key: 'X-Tag', value: 'welcome' }]), [
      { name: 'X-Tag', value: 'welcome' },
    ])
  })
})

test.group('buildMailMime', () => {
  test('builds a single text/plain leaf part', ({ assert }) => {
    const mime = buildMailMime({ text: 'Hello' })

    assert.equal(mime.contentType, 'text/plain')
    assert.equal(mime.body, 'Hello')
    assert.isUndefined(mime.parts)
  })

  test('wraps text + html in multipart/alternative', ({ assert }) => {
    const mime = buildMailMime({ text: 'Hello', html: '<p>Hello</p>' })

    assert.equal(mime.contentType, 'multipart/alternative')
    assert.lengthOf(mime.parts ?? [], 2)
    assert.equal(mime.parts?.[0]?.contentType, 'text/plain')
    assert.equal(mime.parts?.[1]?.contentType, 'text/html')
  })

  test('wraps body + attachments in multipart/mixed', ({ assert }) => {
    const mime = buildMailMime({
      html: '<p>Invoice attached</p>',
      attachments: [
        { filename: 'invoice.pdf', contentType: 'application/pdf', content: Buffer.from('pdf') },
      ],
    })

    assert.equal(mime.contentType, 'multipart/mixed')
    assert.lengthOf(mime.parts ?? [], 2)

    const attachment = mime.parts?.[1]
    assert.equal(attachment?.contentType, 'application/pdf')
    assert.equal(attachment?.filename, 'invoice.pdf')
    assert.equal(attachment?.contentDisposition, 'attachment')
    assert.equal(attachment?.transferEncoding, 'base64')
    assert.equal(attachment?.body, Buffer.from('pdf').toString('base64'))
  })
})

test.group('buildMailEntry', () => {
  const event: AdonisMailSentEvent = {
    mailerName: 'smtp',
    message: {
      from: { address: 'app@example.com', name: 'App' },
      to: ['user@example.com'],
      cc: [{ address: 'cc@example.com' }],
      subject: 'Welcome',
      html: '<p>Hi</p>',
      messageId: '<abc@example.com>',
      date: '2026-01-01T00:00:00.000Z',
    },
    response: {
      messageId: '<fallback@example.com>',
      envelope: { from: 'app@example.com', to: ['user@example.com'] },
    },
  }

  test('maps the event into a MailEntry', ({ assert }) => {
    const entry = buildMailEntry(event, 'req-1')

    assert.equal(entry.requestId, 'req-1')
    assert.deepEqual(entry.from, [{ address: 'app@example.com', name: 'App' }])
    assert.deepEqual(entry.to, [{ address: 'user@example.com' }])
    assert.deepEqual(entry.cc, [{ address: 'cc@example.com' }])
    assert.equal(entry.subject, 'Welcome')
    assert.equal(entry.messageId, '<abc@example.com>')
    assert.equal(entry.date, '2026-01-01T00:00:00.000Z')
    assert.equal(entry.mime.contentType, 'text/html')
    assert.deepEqual(entry.envelope, { mailFrom: 'app@example.com', rcptTo: ['user@example.com'] })
  })

  test('sets driver-agnostic mail metadata', ({ assert }) => {
    const entry = buildMailEntry(event, 'req-1')

    assert.equal(entry.meta.driver, 'adonis')
    assert.equal(entry.meta.transport, 'smtp')
    assert.equal(entry.meta.status, 'sent')
    assert.isString(entry.meta.sentAt)
  })

  test('falls back to the response messageId when the message has none', ({ assert }) => {
    const entry = buildMailEntry(
      { ...event, message: { ...event.message, messageId: undefined } },
      'req-2'
    )

    assert.equal(entry.messageId, '<fallback@example.com>')
  })

  test('defaults requestId to an empty string when not correlated', ({ assert }) => {
    const entry = buildMailEntry({ message: { to: 'user@example.com' } }, '')

    assert.equal(entry.requestId, '')
    assert.deepEqual(entry.to, [{ address: 'user@example.com' }])
  })
})
