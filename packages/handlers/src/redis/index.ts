import { getCurrentRequestId, lensEmitter, type RedisEntry } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const REDACTED = "Purged By Lens";
const MAX_ARG_LEN = 200;
const MAX_ARGS = 32;
const DEFAULT_REDACT = ["auth"];
const LENS_REDIS = Symbol.for("lensjs.redis.instrumented");

/** Minimal structural type so `ioredis` stays an optional dependency. */
export interface LensRedisClient {
  sendCommand: (...args: any[]) => any;
  [key: string]: any;
}

export interface WithLensRedisOptions {
  /** Extra command names (case-insensitive) whose args should be redacted. */
  redactCommands?: string[];
}

function formatArg(arg: unknown): string {
  if (arg === null || arg === undefined) return String(arg);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(arg)) {
    return `<Buffer ${arg.length}b>`;
  }
  let s: string;
  try {
    s =
      typeof arg === "string"
        ? arg
        : typeof arg === "number" || typeof arg === "boolean"
          ? String(arg)
          : JSON.stringify(arg);
  } catch {
    s = String(arg);
  }
  return s.length > MAX_ARG_LEN ? `${s.slice(0, MAX_ARG_LEN)}…` : s;
}

function formatArgs(
  name: unknown,
  args: unknown[],
  redact: Set<string>,
): string[] {
  if (redact.has(String(name ?? "").toLowerCase())) return [REDACTED];
  const limit = Math.min(args.length, MAX_ARGS);
  const out: string[] = [];
  for (let i = 0; i < limit; i++) out.push(formatArg(args[i]));
  if (args.length > MAX_ARGS) out.push(`… (+${args.length - MAX_ARGS} more)`);
  return out;
}

/**
 * Instrument an `ioredis` client so every command is captured by the Lens Redis
 * watcher and correlated to the request that issued it. Idempotent; returns the
 * same client. `AUTH` args are redacted by default.
 */
export function withLensRedis<T extends LensRedisClient>(
  client: T,
  options: WithLensRedisOptions = {},
): T {
  if (!client || typeof client.sendCommand !== "function") return client;
  if ((client as any)[LENS_REDIS]) return client;
  (client as any)[LENS_REDIS] = true;

  const redact = new Set(
    [...DEFAULT_REDACT, ...(options.redactCommands ?? [])].map((c) =>
      c.toLowerCase(),
    ),
  );

  const original = client.sendCommand;

  client.sendCommand = function patchedSendCommand(
    this: unknown,
    command: any,
    ...rest: any[]
  ) {
    const start = process.hrtime.bigint();
    const requestId = getCurrentRequestId();

    const record = (status: RedisEntry["status"], error?: unknown) => {
      try {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        lensEmitter.emit("redis", {
          requestId,
          createdAt: nowISO(),
          command: String(command?.name ?? "").toUpperCase(),
          args: formatArgs(command?.name, command?.args ?? [], redact),
          duration: `${durationMs.toFixed(1)} ms`,
          status,
          error:
            error == null
              ? undefined
              : error instanceof Error
                ? error.message
                : String(error),
        });
      } catch {
        // instrumentation must never break the client
      }
    };

    let result: any;
    try {
      result = original.call(this, command, ...rest);
    } catch (err) {
      record("failed", err);
      throw err;
    }

    if (result && typeof result.then === "function") {
      result.then(
        () => record("success"),
        (err: unknown) => record("failed", err),
      );
    } else {
      record("success");
    }

    return result;
  };

  return client;
}
