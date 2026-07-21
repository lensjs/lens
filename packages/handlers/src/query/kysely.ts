import { getCurrentRequestId, lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { isTransactionQuery } from "../utils/query";
import { KyselyQueryType, QueryWatcherHandler } from "../types";
import type {
  KyselyPlugin,
  LogEvent,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryId,
  RootOperationNode,
} from "kysely";
import { nowISO } from "@lensjs/date";

// Links the in-context capture (transformQuery) to the driver's out-of-context
// log event via Kysely's per-query id (also exposed on `CompiledQuery.queryId`).
// A WeakMap avoids leaks when a compiled query is never executed.
const requestIdByQueryId = new WeakMap<QueryId, string | undefined>();

/**
 * Kysely plugin that records the request id IN-CONTEXT at query-compile time.
 * Kysely's `log` callback fires from the driver's detached completion context,
 * so correlation is lost for async drivers; the id captured here is linked to
 * the log event through the shared `queryId`. Register it on your Kysely instance
 * and keep wiring `log` to emit `kyselyQuery`:
 *
 * ```ts
 * const db = new Kysely({
 *   dialect,
 *   plugins: [createLensKyselyPlugin()],
 *   log: (event) => watcherEmitter.emit("kyselyQuery", event),
 * });
 * ```
 */
export function createLensKyselyPlugin(): KyselyPlugin {
  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      requestIdByQueryId.set(args.queryId, getCurrentRequestId());
      return args.node;
    },
    async transformResult(args: PluginTransformResultArgs) {
      return args.result;
    },
  };
}

function getQueryObject({
  provider,
  payload,
}: {
  provider: KyselyQueryType;
  payload: LogEvent;
}) {
  const sql = lensUtils.interpolateQuery(
    payload.query.sql,
    payload.query.parameters,
  );

  return {
    query: lensUtils.formatSqlQuery(sql, provider),
    duration: `${payload.queryDurationMillis.toFixed(1)} ms`,
    type: provider,
    createdAt: nowISO(),
  };
}

export function createKyselyHandler({
  provider,
  logQueryErrorsToConsole = true,
}: {
  provider: KyselyQueryType;
  logQueryErrorsToConsole?: boolean;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
    watcherEmitter.on("kyselyQuery", (payload) => {
      if (payload.level === "error") {
        if (logQueryErrorsToConsole) {
          console.error({
            error: payload.error,
            ...getQueryObject({ provider, payload }),
          });
        }

        return;
      }

      if (isTransactionQuery(payload.query.sql)) return;

      // Prefer the id captured in-context by the plugin (linked via queryId);
      // fall back to the async context for setups without the plugin.
      const queryId = (payload.query as { queryId?: QueryId }).queryId;
      const captured = queryId ? requestIdByQueryId.get(queryId) : undefined;
      if (queryId) requestIdByQueryId.delete(queryId);

      onQuery(
        getQueryObject({ provider, payload }),
        payload.requestId ?? captured ?? getCurrentRequestId(),
      );
    });
  };
}
