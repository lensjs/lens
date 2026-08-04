import { createRequire } from "node:module";
import type {
  DefaultLogger as MikroDefaultLogger,
  LoggerOptions,
  LogContext,
} from "@mikro-orm/core";
import { watcherEmitter } from "../utils/emitter";

// Resolve `@mikro-orm/core` lazily (only when a logger is actually created), so
// simply importing `@lensjs/watchers` never forces MikroORM to be installed.
const nodeRequire = createRequire(import.meta.url);

/**
 * Create a MikroORM logger that bridges query events to Lens's `watcherEmitter`.
 *
 * `@mikro-orm/core` is required lazily (only when this factory runs), so
 * importing `@lensjs/watchers` never requires MikroORM to be installed.
 *
 * Use it as the `loggerFactory` in your MikroORM configuration:
 *
 * ```ts
 * import { createMikroOrmLensLogger } from "@lensjs/watchers";
 *
 * const orm = await MikroORM.init({
 *   debug: true,
 *   loggerFactory: (options) => createMikroOrmLensLogger(options),
 * });
 * ```
 *
 * Prefer `attachMikroOrmLens(orm)` for SQL drivers (it correlates queries to the
 * request that issued them). Do not enable both, or queries are logged twice.
 */
export function createMikroOrmLensLogger(
  options: LoggerOptions,
): MikroDefaultLogger {
  const { DefaultLogger } = nodeRequire(
    "@mikro-orm/core",
  ) as typeof import("@mikro-orm/core");

  class MikroOrmLensLogger extends DefaultLogger {
    override logQuery(context: LogContext): void {
      // Only emit when the logger is enabled (respects debug mode flags).
      if (!this.isEnabled("query", context)) {
        return;
      }

      const { query, params, took } = context;

      if (query) {
        watcherEmitter.emit("mikroOrmQuery", {
          query,
          params: params ?? [],
          took,
        });
      }
    }
  }

  return new MikroOrmLensLogger(options);
}

/**
 * @deprecated Prefer {@link createMikroOrmLensLogger}. Retained for backward
 * compatibility — `new MikroOrmLensLogger(options)` still works and constructs
 * the logger lazily, so importing `@lensjs/watchers` never requires MikroORM.
 */
export const MikroOrmLensLogger = new Proxy(
  function () {} as unknown as new (options: LoggerOptions) => MikroDefaultLogger,
  {
    construct(_target, args) {
      return createMikroOrmLensLogger(args[0] as LoggerOptions) as object;
    },
  },
);
