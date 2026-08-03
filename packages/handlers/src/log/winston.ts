import TransportStream from "winston-transport";
import type { LogLevel } from "@lensjs/core";
import { emitLensLog, type LogRedactionOptions } from "./emit";

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

class LensWinstonTransport extends TransportStream {
  private readonly redactOptions: LogRedactionOptions;

  constructor(options: LensWinstonTransportOptions = {}) {
    super(options);
    this.redactOptions = { redactKeys: options.redactKeys };
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
          message: typeof message === "string" ? message : String(message ?? ""),
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

/**
 * A winston transport that forwards every log to the Lens log watcher,
 * correlated to the current request. Add it to your logger's `transports`.
 */
export function createLensWinstonTransport(
  options: LensWinstonTransportOptions = {},
): LensWinstonTransport {
  return new LensWinstonTransport(options);
}
