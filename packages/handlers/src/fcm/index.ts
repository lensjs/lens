import {
  getCurrentRequestId,
  lensEmitter,
  type FcmEntry,
  type FcmRecipient,
} from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const LENS_FCM = Symbol.for("lensjs.fcm.instrumented");
const WRAPPED_METHODS = [
  "send",
  "sendEach",
  "sendEachForMulticast",
  "sendMulticast",
  "sendAll",
] as const;

/** Minimal structural type so `firebase-admin` stays an optional dependency. */
export interface LensFcmMessaging {
  [key: string]: any;
}

export interface WithLensFcmOptions {
  /** Include full device tokens instead of truncating them. Default: false. */
  fullTokens?: boolean;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function truncateToken(token: string, full: boolean): string {
  if (full || token.length <= 16) return token;
  return `${token.slice(0, 12)}…`;
}

/** A single message's target string: token (truncated) / topic / condition. */
function messageTarget(msg: any, full: boolean): string | undefined {
  if (msg?.token) return `token:${truncateToken(String(msg.token), full)}`;
  if (msg?.topic) return `topic:${msg.topic}`;
  if (msg?.condition) return `condition:${msg.condition}`;
  return undefined;
}

function describe(
  method: string,
  args: any[],
  full: boolean,
): Pick<FcmEntry, "target" | "title" | "body" | "data"> {
  const first = args[0];

  if (method === "sendEach" || method === "sendAll") {
    const list = Array.isArray(first) ? first : [];
    const sample = list[0];
    return {
      target: `${list.length} message${list.length === 1 ? "" : "s"}`,
      title: sample?.notification?.title,
      body: sample?.notification?.body,
    };
  }

  if (method === "sendEachForMulticast" || method === "sendMulticast") {
    const tokens: string[] = Array.isArray(first?.tokens) ? first.tokens : [];
    return {
      target: `${tokens.length} token${tokens.length === 1 ? "" : "s"}`,
      title: first?.notification?.title,
      body: first?.notification?.body,
      data: first?.data,
    };
  }

  // send(message)
  return {
    target: messageTarget(first, full),
    title: first?.notification?.title,
    body: first?.notification?.body,
    data: first?.data,
  };
}

/** The per-recipient target list for a batch send (empty for single sends). */
function recipientTargets(method: string, args: any[], full: boolean): string[] {
  const first = args[0];

  if (method === "sendEachForMulticast" || method === "sendMulticast") {
    const tokens: string[] = Array.isArray(first?.tokens) ? first.tokens : [];
    return tokens.map((t) => messageTarget({ token: t }, full) ?? String(t));
  }

  if (method === "sendEach" || method === "sendAll") {
    const list = Array.isArray(first) ? first : [];
    return list.map((m, i) => messageTarget(m, full) ?? `message #${i + 1}`);
  }

  return [];
}

/** Zip captured recipient targets with the FCM `BatchResponse.responses`. */
function buildRecipients(
  targets: string[],
  res: any,
  failError?: string,
): FcmRecipient[] | undefined {
  if (!targets.length) return undefined;

  if (failError != null) {
    return targets.map((target) => ({ target, success: false, error: failError }));
  }

  const responses = Array.isArray(res?.responses) ? res.responses : [];
  return targets.map((target, i) => {
    const r = responses[i];
    if (!r) return { target, success: true };
    return {
      target,
      success: !!r.success,
      messageId: r.messageId,
      error: r.error
        ? (r.error.message ?? r.error.code ?? String(r.error))
        : undefined,
    };
  });
}

function resultInfo(method: string, res: any): Partial<FcmEntry> {
  if (method === "send") {
    return { messageId: typeof res === "string" ? res : undefined };
  }
  if (res && typeof res === "object") {
    return {
      successCount: res.successCount,
      failureCount: res.failureCount,
    };
  }
  return {};
}

/**
 * Instrument a `firebase-admin` Messaging instance so every push send is
 * captured by the Lens FCM watcher and correlated to the request that issued
 * it. Idempotent; returns the same instance. Device tokens are truncated by
 * default.
 */
export function withLensFcm<T extends LensFcmMessaging>(
  messaging: T,
  options: WithLensFcmOptions = {},
): T {
  if (!messaging || (messaging as any)[LENS_FCM]) return messaging;
  (messaging as any)[LENS_FCM] = true;

  const full = !!options.fullTokens;
  const box = messaging as Record<string, any>;

  for (const method of WRAPPED_METHODS) {
    const original = box[method];
    if (typeof original !== "function") continue;

    box[method] = function patched(this: unknown, ...args: any[]) {
      const start = process.hrtime.bigint();
      const requestId = getCurrentRequestId();
      const info = describe(method, args, full);
      const targets = recipientTargets(method, args, full);

      const record = (
        status: FcmEntry["status"],
        extra: Partial<FcmEntry>,
      ) => {
        try {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          lensEmitter.emit("fcm", {
            requestId,
            createdAt: nowISO(),
            method,
            duration: `${durationMs.toFixed(1)} ms`,
            status,
            ...info,
            ...extra,
          });
        } catch {
          // instrumentation must never break the sender
        }
      };

      let result: any;
      try {
        result = original.apply(this, args);
      } catch (err) {
        const message = errorMessage(err);
        record("failed", {
          error: message,
          recipients: buildRecipients(targets, undefined, message),
        });
        throw err;
      }

      if (result && typeof result.then === "function") {
        result.then(
          (res: unknown) =>
            record("success", {
              ...resultInfo(method, res),
              recipients: buildRecipients(targets, res),
            }),
          (err: unknown) => {
            const message = errorMessage(err);
            record("failed", {
              error: message,
              recipients: buildRecipients(targets, undefined, message),
            });
          },
        );
      } else {
        record("success", {
          ...resultInfo(method, result),
          recipients: buildRecipients(targets, result),
        });
      }

      return result;
    };
  }

  return messaging;
}
