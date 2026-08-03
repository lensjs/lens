import { format } from "node:util";
import type { LogLevel } from "@lensjs/core";
import { emitLensLog, type LogRedactionOptions } from "./emit";

export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

type ConsoleFn = (...args: any[]) => void;

const METHOD_LEVEL: Record<ConsoleMethod, LogLevel> = {
  log: "info",
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

const ALL_METHODS: ConsoleMethod[] = ["log", "info", "warn", "error", "debug"];

export interface PatchConsoleOptions extends LogRedactionOptions {
  /** Which console methods to capture (default: log, info, warn, error, debug). */
  methods?: ConsoleMethod[];
}

let restore: (() => void) | null = null;

/**
 * Patch the global `console` so each call is captured by the Lens log watcher,
 * correlated to the current request. Returns a function that restores the
 * original methods. Calling it again before restoring is a no-op.
 */
export function patchConsole(options: PatchConsoleOptions = {}): () => void {
  if (restore) return restore;

  const methods = options.methods ?? ALL_METHODS;
  const target = console as unknown as Record<ConsoleMethod, ConsoleFn>;
  const originals = new Map<ConsoleMethod, ConsoleFn>();

  for (const method of methods) {
    const original = target[method].bind(console);
    originals.set(method, original);

    target[method] = (...args: any[]) => {
      try {
        emitLensLog(
          {
            level: METHOD_LEVEL[method],
            message: format(...args),
            source: "console",
          },
          options,
        );
      } catch {
        // instrumentation must never break logging
      }
      original(...args);
    };
  }

  restore = () => {
    for (const [method, original] of originals) {
      target[method] = original;
    }
    restore = null;
  };

  return restore;
}
