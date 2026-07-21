import { lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { MikroOrmQueryType, QueryWatcherHandler } from "../types";
import { nowISO } from "@lensjs/date";

const TRANSACTION_QUERIES = ["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT"];

function shouldIgnoreQuery(query: string): boolean {
  const trimmed = query.trim().toUpperCase();

  return TRANSACTION_QUERIES.some((tq) => trimmed === tq || trimmed.startsWith(`${tq} `));
}

function getQueryObject({
  provider,
  payload,
}: {
  provider: MikroOrmQueryType;
  payload: { query: string; params: unknown[]; took?: number };
}) {
  const sql = lensUtils.interpolateQuery(payload.query, payload.params ?? []);

  return {
    query: lensUtils.formatSqlQuery(sql, provider),
    duration: `${payload.took?.toFixed(1) ?? "0.0"} ms`,
    type: provider,
    createdAt: nowISO(),
  };
}

export function createMikroOrmHandler({
  provider,
}: {
  provider: MikroOrmQueryType;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
    watcherEmitter.on("mikroOrmQuery", (payload) => {
      if (shouldIgnoreQuery(payload.query)) {
        return;
      }

      onQuery(getQueryObject({ provider, payload }));
    });
  };
}
