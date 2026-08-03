import { Writable } from "node:stream";
import type { LogLevel } from "@lensjs/core";
import { emitLensLog, type LogRedactionOptions } from "./emit";

const PINO_NUMERIC_LEVELS: Record<number, LogLevel> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

const LEVEL_NAMES: Record<string, LogLevel> = {
  trace: "trace",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
  fatal: "fatal",
};

function toLevel(value: unknown): LogLevel {
  if (typeof value === "number") return PINO_NUMERIC_LEVELS[value] ?? "info";
  if (typeof value === "string") return LEVEL_NAMES[value.toLowerCase()] ?? "info";
  return "info";
}

export interface LensPinoStreamOptions extends LogRedactionOptions {
  /** pino's `messageKey` (default `"msg"`). */
  messageKey?: string;
}

/**
 * A pino destination stream that forwards every log line to the Lens log
 * watcher, correlated to the current request.
 *
 * Use it as an in-thread destination — `pino(createLensPinoStream())` or via
 * `pino.multistream(...)` — NOT as a worker `transport`, whose detached thread
 * cannot see the request context.
 */
export function createLensPinoStream(
  options: LensPinoStreamOptions = {},
): Writable {
  const messageKey = options.messageKey ?? "msg";

  return new Writable({
    write(chunk, _encoding, callback) {
      try {
        const text = chunk.toString();
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;

          let record: Record<string, any>;
          try {
            record = JSON.parse(line);
          } catch {
            continue;
          }

          const {
            level,
            time: _time,
            pid: _pid,
            hostname: _hostname,
            [messageKey]: message,
            ...context
          } = record;

          emitLensLog(
            {
              level: toLevel(level),
              message: typeof message === "string" ? message : "",
              context: Object.keys(context).length ? context : undefined,
              source: "pino",
            },
            options,
          );
        }
      } catch {
        // instrumentation must never break the logger
      }
      callback();
    },
  });
}
