import {
  getActiveTraceparent,
  getCurrentRequestId,
  lensEmitter,
  type HttpEntry,
} from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const REDACTED = "Purged By Lens";
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key",
]);
const MAX_BODY = 10_000;

let installed = false;

export interface InstrumentFetchOptions {
  /** Capture request/response bodies (size-capped). Default: true. */
  captureBody?: boolean;
  /** Skip capturing calls whose URL matches this predicate. */
  ignore?: (url: string) => boolean;
}

function normalizeHeaders(headers: any): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  try {
    if (typeof headers.forEach === "function") {
      headers.forEach((value: string, key: string) => {
        out[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? REDACTED : value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        out[key] = SENSITIVE_HEADERS.has(String(key).toLowerCase())
          ? REDACTED
          : String(value);
      }
    } else if (typeof headers === "object") {
      for (const [key, value] of Object.entries(headers)) {
        out[key] = SENSITIVE_HEADERS.has(key.toLowerCase())
          ? REDACTED
          : String(value);
      }
    }
  } catch {
    return undefined;
  }
  return out;
}

function cap(text: string): string {
  return text.length > MAX_BODY
    ? `${text.slice(0, MAX_BODY)}… (truncated)`
    : text;
}

/**
 * Instrument the global `fetch` so outgoing HTTP calls are captured by the Lens
 * HTTP watcher and correlated to the request that issued them. Call once at
 * startup (idempotent). Sensitive headers are redacted and bodies are capped.
 */
export function instrumentFetch(options: InstrumentFetchOptions = {}): void {
  if (installed || typeof globalThis.fetch !== "function") return;
  installed = true;

  const original = globalThis.fetch.bind(globalThis);
  const { captureBody = true, ignore } = options;

  globalThis.fetch = (async (input: any, init?: any) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input?.url ?? String(input));

    if (ignore?.(url)) {
      return original(input, init);
    }

    const requestId = getCurrentRequestId();
    const method = String(
      init?.method ??
        (typeof input === "object" ? input?.method : undefined) ??
        "GET",
    ).toUpperCase();
    const requestHeaders = normalizeHeaders(
      init?.headers ?? (typeof input === "object" ? input?.headers : undefined),
    );
    const requestBody =
      captureBody && typeof init?.body === "string" ? cap(init.body) : undefined;

    // Propagate W3C trace context so downstream services join this request's
    // trace (only when tracing is enabled and the caller hasn't set one).
    const traceparent = getActiveTraceparent();
    if (traceparent) {
      const headers = new Headers(
        init?.headers ??
          (input && typeof input === "object" ? input.headers : undefined),
      );
      if (!headers.has("traceparent")) {
        headers.set("traceparent", traceparent);
        init = { ...(init ?? {}), headers };
      }
    }

    const start = process.hrtime.bigint();

    const finish = (durationMs: number, extra: Partial<HttpEntry>) => {
      lensEmitter.emit("http", {
        requestId,
        createdAt: nowISO(),
        method,
        url,
        duration: `${durationMs.toFixed(1)} ms`,
        requestHeaders,
        requestBody,
        ...extra,
      } as HttpEntry);
    };

    try {
      const res = await original(input, init);
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const base: Partial<HttpEntry> = {
        status: res.status,
        responseHeaders: normalizeHeaders(res.headers),
      };

      if (captureBody) {
        // Read a clone off the hot path so the caller isn't blocked/consumed.
        res
          .clone()
          .text()
          .then((text) => finish(durationMs, { ...base, responseBody: cap(text) }))
          .catch(() => finish(durationMs, base));
      } else {
        finish(durationMs, base);
      }

      return res;
    } catch (err: any) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      finish(durationMs, { error: err?.message ?? String(err) });
      throw err;
    }
  }) as typeof fetch;
}
