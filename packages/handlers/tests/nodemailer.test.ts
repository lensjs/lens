import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import fs from "fs";

// Mock external dependencies
vi.mock("@lensjs/core", () => ({
  lensEmitter: {
    emit: vi.fn(),
  },
  lensContext: {
    getStore: vi.fn(),
  },
}));

// Mock addressparser at the top level
vi.mock("nodemailer/lib/addressparser", () => ({
  default: vi.fn((input: string) => {
    if (!input) return [];
    // Simple mock parser that handles "Name <email@example.com>" and "email@example.com"
    return input.split(",").map((part) => {
      part = part.trim();
      const match = part.match(/"?([^"]*)"?\s*<([^>]*)>/);
      if (match) {
        return { name: match[1].trim(), address: match[2].trim() };
      }
      return { name: "", address: part };
    });
  }),
}));

import { Readable } from "stream";
import * as NodemailerUtils from "../src/mail/nodemailer"; // Import all as a namespace
import { lensEmitter, lensContext } from "@lensjs/core";
import addressparser from "nodemailer/lib/addressparser";
import SMTPTransport from "nodemailer/lib/smtp-transport";

describe("Nodemailer Handler", () => {
  const MOCKED_REQUEST_ID = "test-request-id-123";
  const MOCKED_DATE_ISO = "2025-09-05T10:00:00.000Z";

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks on lensEmitter, lensContext
    vi.mocked(addressparser).mockClear(); // Clear addressparser mock calls
    (lensContext.getStore as Mock).mockReturnValue({
      requestId: MOCKED_REQUEST_ID,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date(MOCKED_DATE_ISO));
    vi.spyOn(fs.promises, "readFile").mockResolvedValue(Buffer.from("file content"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks(); // Restore all spies and mocks
  });

  // --- normalizeAddresses ---
  describe("normalizeAddresses", () => {
    beforeEach(() => {
        // Provide a robust mock for addressparser for these tests
        vi.mocked(addressparser).mockImplementation((input: string) => {
            if (input === "") return [];
            if (input === "test@example.com") return [{ name: "", address: "test@example.com" }];
            if (input === '"Test User" <test@example.com>') return [{ name: "Test User", address: "test@example.com" }];
            if (input === "test1@example.com, test2@example.com") return [{ name: "", address: "test1@example.com" }, { name: "", address: "test2@example.com" }];
            if (input === '"User One" <user1@example.com>, "User Two" <user2@example.com>') return [{ name: "User One", address: "user1@example.com" }, { name: "User Two", address: "user2@example.com" }];
            if (input === '"Mixed User" <mixed@example.com>, another@example.com') return [{ name: "Mixed User", address: "mixed@example.com" }, { name: "", address: "another@example.com" }];
            return [];
        });
    });

    it("should return an empty array for null or undefined input", () => {
      expect(NodemailerUtils.normalizeAddresses(null)).toEqual([]);
      expect(NodemailerUtils.normalizeAddresses(undefined)).toEqual([]);
    });

    it("should return an empty array for an empty string or empty array", () => {
      expect(NodemailerUtils.normalizeAddresses("")).toEqual([]);
      expect(NodemailerUtils.normalizeAddresses([])).toEqual([]);
    });

    it("should normalize a single string address", () => {
      expect(NodemailerUtils.normalizeAddresses("test@example.com")).toEqual([
        { name: "", address: "test@example.com" },
      ]);
      expect(addressparser).toHaveBeenCalledWith("test@example.com", { flatten: true });
    });

    it("should normalize a single object address", () => {
      expect(
        NodemailerUtils.normalizeAddresses({ name: "Test User", address: "test@example.com" }),
      ).toEqual([{ name: "Test User", address: "test@example.com" }]);
      expect(addressparser).toHaveBeenCalledWith('"Test User" <test@example.com>', { flatten: true });
    });

    it("should normalize an array of string addresses", () => {
      expect(NodemailerUtils.normalizeAddresses(["test1@example.com", "test2@example.com"])).toEqual(
        [
          { name: "", address: "test1@example.com" },
          { name: "", address: "test2@example.com" },
        ],
      );
      expect(addressparser).toHaveBeenCalledWith("test1@example.com, test2@example.com", { flatten: true });
    });

    it("should normalize an array of object addresses", () => {
      expect(
        NodemailerUtils.normalizeAddresses([
          { name: "User One", address: "user1@example.com" },
          { name: "User Two", address: "user2@example.com" },
        ]),
      ).toEqual([
        { name: "User One", address: "user1@example.com" },
        { name: "User Two", address: "user2@example.com" },
      ]);
      expect(addressparser).toHaveBeenCalledWith('"User One" <user1@example.com>, "User Two" <user2@example.com>', { flatten: true });
    });

    it("should normalize a mixed array of addresses", () => {
      expect(
        NodemailerUtils.normalizeAddresses([
          { name: "Mixed User", address: "mixed@example.com" },
          "another@example.com",
        ]),
      ).toEqual([
        { name: "Mixed User", address: "mixed@example.com" },
        { name: "", address: "another@example.com" },
      ]);
      expect(addressparser).toHaveBeenCalledWith('"Mixed User" <mixed@example.com>, another@example.com', { flatten: true });
    });
  });

  // --- parseStatus ---
  describe("parseStatus", () => {
    it("should return 'sent' for success codes (2xx)", () => {
      expect(NodemailerUtils.parseStatus(200)).toBe("sent");
      expect(NodemailerUtils.parseStatus(250)).toBe("sent");
      expect(NodemailerUtils.parseStatus(299)).toBe("sent");
    });

    it("should return 'failed' for non-success codes", () => {
      expect(NodemailerUtils.parseStatus(100)).toBe("failed");
      expect(NodemailerUtils.parseStatus(300)).toBe("failed");
      expect(NodemailerUtils.parseStatus(400)).toBe("failed");
      expect(NodemailerUtils.parseStatus(500)).toBe("failed");
    });
  });

  // --- resolveContent ---
  describe("resolveContent", () => {
    it("should return undefined for undefined input", async () => {
      await expect(NodemailerUtils.resolveContent(undefined)).resolves.toBeUndefined();
    });

    it("should return the string for string input", async () => {
      await expect(NodemailerUtils.resolveContent("hello")).resolves.toEqual({ body: "hello" });
    });

    it("should return the base64 string for Buffer input", async () => {
      const buf = Buffer.from("test");
      await expect(NodemailerUtils.resolveContent(buf)).resolves.toEqual({
        body: buf.toString("base64"),
        transferEncoding: "base64",
      });
    });

    it("should return concatenated base64 string for Readable stream input", async () => {
      const stream = new Readable();
      stream.push("part1");
      stream.push("part2");
      stream.push(null); // No more data
      await expect(NodemailerUtils.resolveContent(stream)).resolves.toEqual({
        body: Buffer.from("part1part2").toString("base64"),
        transferEncoding: "base64",
      });
    });

    it("should resolve content from AttachmentLike object with 'content' as string", async () => {
      const attachment = {
        filename: "test.txt",
        content: "attachment content",
      };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: "attachment content",
      });
    });

    it("should resolve content from AttachmentLike object with 'content' as Buffer", async () => {
      const buf = Buffer.from("attachment buffer");
      const attachment = {
        filename: "test.pdf",
        content: buf,
      };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: buf.toString("base64"),
        transferEncoding: "base64",
      });
    });

    it("should resolve content from AttachmentLike object with 'content' as Readable stream", async () => {
      const stream = new Readable();
      stream.push("streamed attachment");
      stream.push(null);
      const attachment = {
        filename: "test.log",
        content: stream,
      };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: Buffer.from("streamed attachment").toString("base64"),
        transferEncoding: "base64",
      });
    });

    it("should return undefined for AttachmentLike object without content or path", async () => {
      const attachment = { filename: "test.txt" };
      await expect(NodemailerUtils.resolveContent(attachment as any)).resolves.toBeUndefined();
    });

    it("should resolve content from a local path using readFile", async () => {
      const attachment = { path: "/path/to/file.txt" };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: Buffer.from("file content").toString("base64"),
        transferEncoding: "base64",
      });
    });

    it("should resolve content from a URL using fetch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode("url content").buffer),
      });
      vi.stubGlobal("fetch", mockFetch);

      const attachment = { path: "https://example.com/file.txt" };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: Buffer.from("url content").toString("base64"),
        transferEncoding: "base64",
      });
      expect(mockFetch).toHaveBeenCalledWith("https://example.com/file.txt");
    });

    it("should resolve content from a data URI (base64)", async () => {
      const attachment = { path: "data:text/plain;base64,SGVsbG8gd29ybGQ=" };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: "SGVsbG8gd29ybGQ=",
        transferEncoding: "base64",
      });
    });

    it("should resolve content from a data URI (plain)", async () => {
      const attachment = { path: "data:text/plain,Hello%20world" };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: "Hello world",
        transferEncoding: undefined,
      });
    });

    it("should decode base64 content when encoding is set to base64", async () => {
      const attachment = { content: "SGVsbG8gd29ybGQ=", encoding: "base64" };
      await expect(NodemailerUtils.resolveContent(attachment)).resolves.toEqual({
        body: "SGVsbG8gd29ybGQ=",
        transferEncoding: "base64",
      });
    });

    it("should resolve content from href property", async () => {
      const attachment = { href: "https://example.com/file.txt" };
      const mockFetch = vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode("url content").buffer),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(NodemailerUtils.resolveContent(attachment as any)).resolves.toEqual({
        body: Buffer.from("url content").toString("base64"),
        transferEncoding: "base64",
      });
    });
  });

  // --- normalizeListHeaders ---
  describe("normalizeListHeaders", () => {
    it("should return an empty array for null or undefined input", () => {
      expect(NodemailerUtils.normalizeListHeaders(null)).toEqual([]);
      expect(NodemailerUtils.normalizeListHeaders(undefined)).toEqual([]);
    });

    it("should normalize simple string list headers", () => {
      const input = {
        help: "admin@example.com?subject=help",
        unsubscribe: "http://example.com/unsub",
      };
      expect(NodemailerUtils.normalizeListHeaders(input)).toEqual([
        { name: "List-Help", value: "<mailto:admin@example.com?subject=help>" },
        { name: "List-Unsubscribe", value: "<http://example.com/unsub>" },
      ]);
    });

    it("should handle objects with url and comment", () => {
      const input = {
        unsubscribe: { url: "http://example.com", comment: "Comment" },
      };
      expect(NodemailerUtils.normalizeListHeaders(input)).toEqual([
        { name: "List-Unsubscribe", value: "<http://example.com> (Comment)" },
      ]);
    });

    it("should handle arrays of list headers (multiple lines)", () => {
      const input = {
        subscribe: ["admin@example.com", { url: "http://example.com", comment: "Sub" }],
      };
      expect(NodemailerUtils.normalizeListHeaders(input)).toEqual([
        { name: "List-Subscribe", value: "<mailto:admin@example.com>" },
        { name: "List-Subscribe", value: "<http://example.com> (Sub)" },
      ]);
    });

    it("should handle nested arrays (single line comma separated)", () => {
      const input = {
        post: [["http://example.com/post", "admin@example.com"]],
      };
      expect(NodemailerUtils.normalizeListHeaders(input)).toEqual([
        { name: "List-Post", value: "<http://example.com/post>, <mailto:admin@example.com>" },
      ]);
    });
  });

  // --- buildMimeParts ---
  describe("buildMimeParts", () => {
    it("should return a single text/plain part for text content", async () => {
      const options = { text: "Hello Text" };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart).toEqual({
        contentType: "text/plain",
        transferEncoding: "quoted-printable",
        body: "Hello Text",
        size: 10,
        headers: [],
      });
    });

    it("should extract headers and Content-Type from top-level raw content", async () => {
        const raw = "From: sender@example.com\r\nContent-Type: text/markdown\r\nSubject: Raw\r\n\r\n# Hello";
        const options = { raw };
        const mimePart = await NodemailerUtils.buildMimeParts(options);
        expect(mimePart.contentType).toBe("text/markdown");
        expect(mimePart.body).toBe(raw);
        expect(mimePart.headers).toContainEqual({ name: "From", value: "sender@example.com" });
        expect(mimePart.headers).toContainEqual({ name: "Subject", value: "Raw" });
    });

    it("should group text and html into multipart/alternative", async () => {
        const options = { text: "Text", html: "<p>HTML</p>" };
        const mimePart = await NodemailerUtils.buildMimeParts(options);
        expect(mimePart.contentType).toBe("multipart/alternative");
        expect(mimePart.parts).toHaveLength(2);
        expect(mimePart.parts![0].contentType).toBe("text/plain");
        expect(mimePart.parts![0].size).toBe(4);
        expect(mimePart.parts![1].contentType).toBe("text/html");
        expect(mimePart.parts![1].size).toBe(11);
    });

    it("should include custom alternatives in the alternative block", async () => {
        const options = {
            text: "Text",
            alternatives: [{ contentType: "text/x-custom", content: "custom" }]
        };
        const mimePart = await NodemailerUtils.buildMimeParts(options);
        expect(mimePart.contentType).toBe("multipart/alternative");
        expect(mimePart.parts).toHaveLength(2);
        expect(mimePart.parts![1].contentType).toBe("text/x-custom");
        expect(mimePart.parts![1].body).toBe("custom");
        expect(mimePart.parts![1].size).toBe(6);
    });

    it("should use raw override for attachments if provided", async () => {
        const options = {
            attachments: [
                { filename: "test.txt", content: "normal", raw: "overridden" }
            ]
        };
        const mimePart = await NodemailerUtils.buildMimeParts(options);
        expect(mimePart.body).toBe("overridden");
        expect(mimePart.size).toBe(10);
    });

    it("should return a single text/html part for html content", async () => {
      const options = { html: "<p>Hello HTML</p>" };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart).toEqual({
        contentType: "text/html",
        transferEncoding: "quoted-printable",
        body: "<p>Hello HTML</p>",
        size: 17,
        headers: [],
      });
    });

    it("should return a single text/x-amp-html part for AMP content", async () => {
      const options = { amp: "<p>Hello AMP</p>" };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart).toEqual({
        contentType: "text/x-amp-html",
        body: "<p>Hello AMP</p>",
        size: 16,
        headers: [],
      });
    });

    it("should return a single text/calendar part for iCal event", async () => {
      const options = { icalEvent: "BEGIN:VCALENDAR..." };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart).toEqual({
        contentType: "text/calendar; method=PUBLISH",
        body: "BEGIN:VCALENDAR...",
        filename: "invite.ics",
        size: 18,
        transferEncoding: undefined,
        headers: [],
      });
    });

    it("should return multiple parts wrapped in multipart/alternative for text and html", async () => {
      const options = { text: "Text", html: "<h1>HTML</h1>" };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart.contentType).toBe("multipart/alternative");
      expect(mimePart.parts).toHaveLength(2);
      expect(mimePart.parts![0].contentType).toBe("text/plain");
      expect(mimePart.parts![0].size).toBe(4);
      expect(mimePart.parts![1].contentType).toBe("text/html");
      expect(mimePart.parts![1].size).toBe(13);
    });

    it("should include attachments with correct properties (single attachment)", async () => {
      const options = {
        attachments: [
          {
            filename: "file1.txt",
            content: "file1 content",
            contentType: "text/plain",
            contentDisposition: "inline",
            cid: "unique_id",
            contentTransferEncoding: "base64",
          },
        ],
      };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      // If only one attachment, it's not wrapped in multipart/mixed by the function
      expect(mimePart).toEqual(
        expect.objectContaining({
          filename: "file1.txt",
          body: "file1 content",
          contentType: "text/plain",
          contentDisposition: "inline",
          contentId: "unique_id",
          transferEncoding: "base64",
          size: 13,
        }),
      );
    });

    it("should combine attachments and alternatives (resulting in multipart/mixed)", async () => {
      const options = {
        text: "Body",
        attachments: [{ filename: "att.pdf", content: "pdf" }],
        alternatives: [{ filename: "alt.html", content: "alt html" }],
      };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart.contentType).toBe("multipart/mixed");
      expect(mimePart.parts).toHaveLength(2); // One alternative block, one attachment
      expect(mimePart.parts![0].contentType).toBe("multipart/alternative");
      expect(mimePart.parts![0].parts).toHaveLength(2); // text, alt.html
      expect(mimePart.parts![1].filename).toBe("att.pdf");
    });

    it("should combine all alternative types (text, html, watch, amp, ical) into multipart/alternative", async () => {
      const options = {
        text: "text",
        html: "html",
        watchHtml: "watch",
        amp: "amp",
        icalEvent: "ical"
      };
      const mimePart = await NodemailerUtils.buildMimeParts(options);
      expect(mimePart.contentType).toBe("multipart/alternative");
      expect(mimePart.parts).toHaveLength(5);
      expect(mimePart.parts![0].contentType).toBe("text/plain");
      expect(mimePart.parts![1].contentType).toBe("text/html");
      expect(mimePart.parts![2].contentType).toBe("text/html"); // watchHtml
      expect(mimePart.parts![3].contentType).toBe("text/x-amp-html");
      expect(mimePart.parts![4].contentType).toBe("text/calendar; method=PUBLISH");
    });

    it("should handle empty options, returning default text/plain", async () => {
      const mimePart = await NodemailerUtils.buildMimeParts({});
      expect(mimePart).toEqual({
        contentType: "text/plain",
        headers: [],
        body: "",
      });
    });
  });

  // --- normalizeHeaders ---
  describe("normalizeHeaders", () => {
    it("should return an empty array for null or undefined input", () => {
      expect(NodemailerUtils.normalizeHeaders(null)).toEqual([]);
      expect(NodemailerUtils.normalizeHeaders(undefined)).toEqual([]);
    });

    it("should return an empty array for an empty object", () => {
      expect(NodemailerUtils.normalizeHeaders({})).toEqual([]);
    });

    it("should normalize a simple object of headers", () => {
      const input = {
        "X-Custom-Header": "value1",
        "Content-Type": "text/plain",
      };
      expect(NodemailerUtils.normalizeHeaders(input)).toEqual([
        { name: "X-Custom-Header", value: "value1" },
        { name: "Content-Type", value: "text/plain" },
      ]);
    });

    it("should normalize headers with array values", () => {
      const input = {
        "X-Array-Header": ["valueA", "valueB"],
      };
      expect(NodemailerUtils.normalizeHeaders(input)).toEqual([
        { name: "X-Array-Header", value: "valueA" },
        { name: "X-Array-Header", value: "valueB" },
      ]);
    });

    it("should normalize headers with 'prepared' and 'value' properties", () => {
      const input = {
        "Content-Length": { prepared: true, value: "123" },
      };
      expect(NodemailerUtils.normalizeHeaders(input)).toEqual([
        { name: "Content-Length", value: "123" },
      ]);
    });

    it("should normalize an array of { key, value } headers", () => {
      const input = [
        { key: "Authorization", value: "Bearer token" },
        { key: "Accept", value: "application/json" },
      ];
      expect(NodemailerUtils.normalizeHeaders(input)).toEqual([
        { name: "Authorization", value: "Bearer token" },
        { name: "Accept", value: "application/json" },
      ]);
    });

    it("should handle mixed header types", () => {
      const input = {
        "X-Single": "singleValue",
        "X-Multi": ["multi1", "multi2"],
        "X-Prepared": { prepared: true, value: "preparedValue" },
      };
      const expected = [
        { name: "X-Single", value: "singleValue" },
        { name: "X-Multi", value: "multi1" },
        { name: "X-Multi", value: "multi2" },
        { name: "X-Prepared", value: "preparedValue" },
      ];
      expect(NodemailerUtils.normalizeHeaders(input)).toEqual(expect.arrayContaining(expected));
      expect(NodemailerUtils.normalizeHeaders(input)).toHaveLength(expected.length);
    });
  });

  // --- logNodeMailerEntry ---
  describe("logNodeMailerEntry", () => {
    const actualLogNodeMailerEntry = NodemailerUtils.logNodeMailerEntry;

    beforeEach(async () => {
      vi.clearAllMocks(); // Clear mocks from previous describe blocks
      (lensContext.getStore as Mock).mockReturnValue({
        requestId: MOCKED_REQUEST_ID,
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCKED_DATE_ISO));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks(); // Restore mocks and spies
    });


    it("should emit a mail event with a fully formed MailEntry for a successful send", async () => {
      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        text: "Hello",
        html: "<p>Hello</p>",
        messageId: "msg-123",
        date: new Date(MOCKED_DATE_ISO),
        headers: { "X-Custom": "custom-value" },
        replyTo: "reply@example.com",
        list: {
            unsubscribe: "http://example.com/unsub"
        }
      };
      const message: any = {
        envelope: { from: "sender@example.com", to: ["recipient@example.com"] },
        messageId: "msg-123-real",
        response: "250 OK: Message accepted",
        envelopeTime: 100,
        messageTime: 50,
        messageSize: 500,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry).toMatchObject({
        requestId: MOCKED_REQUEST_ID,
        from: [{ name: "", address: "sender@example.com" }],
        to: [{ name: "", address: "recipient@example.com" }],
        replyTo: [{ name: "", address: "reply@example.com" }],
        subject: "Test Subject",
        messageId: "msg-123", // Payload messageId should take precedence
        date: MOCKED_DATE_ISO,
        headers: [
            { name: "X-Custom", value: "custom-value" },
            { name: "List-Unsubscribe", value: "<http://example.com/unsub>" },
        ],
        mime: {
            contentType: "multipart/alternative",
            size: 500, // From message.messageSize mock below
            parts: [
                { contentType: "text/plain", body: "Hello", size: 5 },
                { contentType: "text/html", body: "<p>Hello</p>", size: 12 },
            ],
        },
        envelope: {
          mailFrom: "sender@example.com",
          rcptTo: ["recipient@example.com"],
        },
        raw: undefined,
        meta: {
          driver: "nodemailer",
          transport: "smtp",
          status: "sent",
          durationMs: 100,
          sentAt: MOCKED_DATE_ISO,
        },
      });
    });

    it("should use message.messageId if payload.messageId is not provided", async () => {
      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        date: new Date(MOCKED_DATE_ISO),
      };
      const message: SMTPTransport.SentMessageInfo = {
        envelope: { from: "sender@example.com", to: ["recipient@example.com"] },
        messageId: "msg-from-message-info",
        response: "250 OK",
        envelopeTime: 10,
        messageTime: 5,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry.messageId).toBe("msg-from-message-info");
    });

    it("should handle missing requestId gracefully", async () => {
      (lensContext.getStore as Mock).mockReturnValue(undefined);

      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        date: new Date(MOCKED_DATE_ISO),
      };
      const message: SMTPTransport.SentMessageInfo = {
        envelope: { from: "sender@example.com", to: ["recipient@example.com"] },
        messageId: "msg-123",
        response: "250 OK",
        envelopeTime: 10,
        messageTime: 5,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry.requestId).toBe("");
    });

    it("should set status to 'failed' for error responses", async () => {
      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Failed Email",
        date: new Date(MOCKED_DATE_ISO),
      };
      const message: SMTPTransport.SentMessageInfo = {
        envelope: { from: "sender@example.com", to: ["recipient@example.com"] },
        messageId: "msg-fail",
        response: "550 User unknown",
        envelopeTime: 10,
        messageTime: 5,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry.meta.status).toBe("failed");
    });

    it("should correctly capture cc and bcc recipients", async () => {
      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        cc: "cc@example.com",
        bcc: "bcc@example.com",
        subject: "Test Subject",
        date: new Date(MOCKED_DATE_ISO),
      };
      const message: SMTPTransport.SentMessageInfo = {
        envelope: {
          from: "sender@example.com",
          to: ["recipient@example.com", "cc@example.com", "bcc@example.com"],
        },
        messageId: "msg-123",
        response: "250 OK",
        envelopeTime: 10,
        messageTime: 5,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry.cc).toEqual([{ name: "", address: "cc@example.com" }]);
      expect(emittedEntry.bcc).toEqual([{ name: "", address: "bcc@example.com" }]);
    });

    it("should correctly capture other payload fields like references and priority", async () => {
      const transport = "smtp";
      const payload = {
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        date: new Date(MOCKED_DATE_ISO),
        references: "ref-1 ref-2",
        priority: "high" as any,
      };
      const message: SMTPTransport.SentMessageInfo = {
        envelope: { from: "sender@example.com", to: ["recipient@example.com"] },
        messageId: "msg-123",
        response: "250 OK",
        envelopeTime: 10,
        messageTime: 5,
      };

      await actualLogNodeMailerEntry(transport, payload, message);

      const emittedEntry = (lensEmitter.emit as Mock).mock.calls[0][1];
      expect(emittedEntry.references).toBe("ref-1 ref-2");
      expect(emittedEntry.priority).toBe("high");
    });
  });
});
