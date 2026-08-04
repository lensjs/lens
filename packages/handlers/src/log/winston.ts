import { createRequire } from "node:module";
import type TransportStream from "winston-transport";
import type { LogLevel } from "@lensjs/core";
import { emitLensLog, type LogRedactionOptions } from "./emit";

// Resolve `winston-transport` lazily so importing `@lensjs/watchers` never
// requires winston to be installed.
const nodeRequire = createRequire(import.meta.url);

const WINSTON_LEVELS: Record<string, LogLevel> = {
  error: "error",
  warn: "warn",
  info: "info",
  http: "info",
  verbose: "debug",
  debug: "debug",
  silly: "trace",
};

export interface LensWinstonTransportOptions
  extends LogRedactionOptions,
    TransportStream.TransportStreamOptions {}

/**
 * A winston transport that forwards every log to the Lens log watcher,
 * correlated to the current request. Add it to your logger's `transports`.
 *
 * `winston-transport` is required lazily (only when this factory runs), so
 * importing `@lensjs/watchers` never requires winston to be installed.
 */
export function createLensWinstonTransport(
  options: LensWinstonTransportOptions = {},
): TransportStream {
  const mod = nodeRequire("winston-transport") as
    | typeof TransportStream
    | { default: typeof TransportStream };
  const TransportImpl = (
    typeof mod === "function" ? mod : mod.default
  ) as typeof TransportStream;

  class LensWinstonTransport extends TransportImpl {
    private readonly redactOptions: LogRedactionOptions;

    constructor(opts: LensWinstonTransportOptions = {}) {
      super(opts);
      this.redactOptions = { redactKeys: opts.redactKeys };
    }

    override log(info: any, next: () => void): void {
      // Preserve winston's contract so downstream listeners still fire.
      setImmediate(() => this.emit("logged", info));

      try {
        const levelName: string = info[Symbol.for("level")] ?? info.level;
        const { level: _level, message, ...context } = info;

        emitLensLog(
          {
            level: WINSTON_LEVELS[levelName] ?? "info",
            message:
              typeof message === "string" ? message : String(message ?? ""),
            context: Object.keys(context).length ? context : undefined,
            source: "winston",
          },
          this.redactOptions,
        );
      } catch {
        // instrumentation must never break the logger
      }

      next();
    }
  }

  return new LensWinstonTransport(options);
}
