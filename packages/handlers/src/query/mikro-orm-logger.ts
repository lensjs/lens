import { DefaultLogger, type LoggerOptions, type LogContext } from "@mikro-orm/core";
import { watcherEmitter } from "../utils/emitter";

/**
 * A MikroORM logger that bridges query events to Lens's watcherEmitter.
 *
 * Use this as the `loggerFactory` in your MikroORM configuration:
 *
 * ```ts
 * import { MikroOrmLensLogger } from "@lensjs/watchers";
 *
 * const orm = await MikroORM.init({
 *   debug: true,
 *   loggerFactory: (options) => new MikroOrmLensLogger(options),
 *   // ...
 * });
 * ```
 *
 * When debug mode is enabled, every query executed by MikroORM will be
 * emitted as a `mikroOrmQuery` event on the `watcherEmitter`, which the
 * `createMikroOrmHandler` listens to.
 */
export class MikroOrmLensLogger extends DefaultLogger {
  constructor(options: LoggerOptions) {
    super(options);
  }

  override logQuery(context: LogContext): void {
    // Only emit when the logger is enabled (respects debug mode flags)
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

    // Optionally also call the parent implementation for console output
    // Uncomment the line below if you want queries printed to console as well:
    // super.logQuery(context);
  }
}
