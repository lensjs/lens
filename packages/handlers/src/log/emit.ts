import {
  getCurrentRequestId,
  lensEmitter,
  type LogEntry,
  type LogLevel,
} from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const MAX_CONTEXT_LENGTH = 10_000;
const MAX_MESSAGE_LENGTH = 10_000;

const DEFAULT_REDACT_KEYS = [
  "password",
  "passwordconfirmation",
  "password_confirmation",
  "secret",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "authorization",
  "apikey",
  "api_key",
];

export interface LogRedactionOptions {
  /**
   * Extra context keys (case-insensitive) to redact before the entry is stored,
   * merged with the built-in defaults (password, secret, token, authorization…).
   */
  redactKeys?: string[];
}

/**
 * Redact sensitive keys from a log context and cap its serialized size so large
 * or secret-bearing payloads never reach the store. Runs BEFORE emit, mirroring
 * the redaction guarantees of the request watcher.
 */
export function redactAndCap(
  context: Record<string, any> | undefined,
  extraKeys: string[] = [],
): Record<string, any> | undefined {
  if (context === undefined || context === null) return undefined;

  const keys = new Set([
    ...DEFAULT_REDACT_KEYS,
    ...extraKeys.map((k) => k.toLowerCase()),
  ]);
  const seen = new WeakSet<object>();

  const redact = (value: unknown): unknown => {
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if (Array.isArray(value)) return value.map(redact);

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = keys.has(key.toLowerCase()) ? "*******" : redact(val);
    }
    return out;
  };

  let redacted: unknown;
  try {
    redacted = redact(context);
  } catch {
    return { __unserializable: true };
  }

  try {
    const json = JSON.stringify(redacted);
    if (json && json.length > MAX_CONTEXT_LENGTH) {
      return { __truncated: true, preview: json.slice(0, MAX_CONTEXT_LENGTH) };
    }
  } catch {
    return { __unserializable: true };
  }

  return redacted as Record<string, any>;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Match `key: value` / `key=value` (value optionally quoted) for a set of keys. */
function buildMessageRedactor(keys: string[]): RegExp | null {
  const alternation = keys.map(escapeRegExp).join("|");
  if (!alternation) return null;
  return new RegExp(
    `(["']?\\b(?:${alternation})\\b["']?\\s*[:=]\\s*)(?:"[^"]*"|'[^']*'|[^\\s,;}\\])]+)`,
    "gi",
  );
}

const DEFAULT_MESSAGE_REDACTOR = buildMessageRedactor(DEFAULT_REDACT_KEYS);

/**
 * Best-effort redaction for a formatted log message. A message is free-form text
 * (unlike structured context), so this masks `key: value` / `key=value` pairs
 * whose key matches a sensitive name — the same list used for context — and caps
 * the length. It catches the common `console.log("token:", secret)` and
 * object-logging (`console.log({ apiKey })`) cases without dropping the message.
 */
export function redactMessage(
  message: string,
  extraKeys: string[] = [],
): string {
  if (!message) return message;

  const redactor = extraKeys.length
    ? buildMessageRedactor([
        ...DEFAULT_REDACT_KEYS,
        ...extraKeys.map((k) => k.toLowerCase()),
      ])
    : DEFAULT_MESSAGE_REDACTOR;

  const masked = redactor ? message.replace(redactor, "$1*******") : message;

  return masked.length > MAX_MESSAGE_LENGTH
    ? `${masked.slice(0, MAX_MESSAGE_LENGTH)}… [truncated]`
    : masked;
}

export interface EmitLensLogInput {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  /** Which logger produced this entry (e.g. "console", "pino", "winston"). */
  source?: string;
  requestId?: string;
  createdAt?: string;
}

/**
 * Normalize, redact, and emit a log entry to the Lens log watcher, correlated to
 * the current request. Use this to feed a custom logger into Lens.
 */
export function emitLensLog(
  input: EmitLensLogInput,
  options: LogRedactionOptions = {},
): void {
  const entry: LogEntry = {
    level: input.level,
    message: redactMessage(input.message, options.redactKeys),
    context: redactAndCap(input.context, options.redactKeys),
    source: input.source,
    requestId: input.requestId ?? getCurrentRequestId(),
    createdAt: input.createdAt ?? nowISO(),
  };

  lensEmitter.emit("log", entry);
}
