import { getCurrentRequestId, lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { isTransactionQuery } from "../utils/query";
import { DrizzleQueryType, QueryWatcherHandler } from "../types";
import { nowISO } from "@lensjs/date";

/**
 * The subset of Drizzle's `Logger` interface Lens implements. Declared
 * structurally so `@lensjs/watchers` never needs `drizzle-orm` at build time;
 * the returned object is assignable to Drizzle's `logger` option.
 */
export type DrizzleLensLogger = {
  logQuery(query: string, params: unknown[]): void;
};

/**
 * A Drizzle `Logger` that captures queries in-context. Drizzle calls `logQuery`
 * synchronously at query-issue time, so `getCurrentRequestId()` correlates the
 * query to the active request. Pass it to `drizzle(client, { logger })`.
 *
 * ```ts
 * const db = drizzle(client, { logger: createLensDrizzleLogger() });
 * // handler: createDrizzleHandler({ provider: "postgresql" })
 * ```
 */
export function createLensDrizzleLogger(): DrizzleLensLogger {
  return {
    logQuery(query: string, params: unknown[]): void {
      watcherEmitter.emit("drizzleQuery", {
        query,
        params: params ?? [],
        requestId: getCurrentRequestId(),
      });
    },
  };
}

function getQueryObject({
  provider,
  payload,
}: {
  provider: DrizzleQueryType;
  payload: { query: string; params: unknown[] };
}) {
  // Interpolation/formatting must never throw into the query path.
  let sql = payload.query;
  try {
    sql = lensUtils.interpolateQuery(payload.query, payload.params ?? []);
  } catch {
    sql = payload.query;
  }

  let query: string;
  try {
    query = lensUtils.formatSqlQuery(sql, provider);
  } catch {
    query = sql;
  }

  return {
    query,
    // Drizzle's Logger interface carries no timing information.
    duration: "0 ms",
    type: provider,
    createdAt: nowISO(),
  };
}

export function createDrizzleHandler({
  provider,
}: {
  provider: DrizzleQueryType;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
    watcherEmitter.on("drizzleQuery", (payload) => {
      if (isTransactionQuery(payload.query)) {
        return;
      }

      onQuery(
        getQueryObject({ provider, payload }),
        payload.requestId ?? getCurrentRequestId(),
      );
    });
  };
}
