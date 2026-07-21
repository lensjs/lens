import { getCurrentRequestId, lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { isTransactionQuery } from "../utils/query";
import { MikroOrmQueryType, QueryWatcherHandler } from "../types";
import { nowISO } from "@lensjs/date";

function getQueryObject({
  provider,
  payload,
}: {
  provider: MikroOrmQueryType;
  payload: { query: string; params: unknown[]; took?: number };
}) {
  // Formatting must never throw into the query path.
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

/**
 * Attach Lens to a MikroORM instance so queries correlate to the request that
 * issued them. MikroORM's logger fires from the driver's detached completion
 * context (correlation is lost for async drivers), so the request id is captured
 * IN-CONTEXT from the underlying knex `query` event and linked to the result via
 * knex's per-query id. Use this INSTEAD of `MikroOrmLensLogger` for SQL drivers
 * (do not enable both, or queries will be logged twice).
 *
 * ```ts
 * const orm = await MikroORM.init({ ... });
 * attachMikroOrmLens(orm);
 * // handler: createMikroOrmHandler({ provider: "postgresql" })
 * ```
 */
export function attachMikroOrmLens(orm: any) {
  const knexInstances: any[] = [];
  try {
    const em = orm?.em ?? orm?.getEntityManager?.();
    for (const type of ["write", "read"] as const) {
      try {
        const knex = em?.getConnection?.(type)?.getKnex?.();
        if (knex && !knexInstances.includes(knex)) knexInstances.push(knex);
      } catch {
        // connection type unavailable — ignore
      }
    }
  } catch {
    // not a SQL driver (e.g. MongoDB) — nothing to attach
  }

  for (const knex of knexInstances) {
    const startedAt = new Map<string, bigint>();
    const requestIds = new Map<string, string | undefined>();

    knex.on("query", (q: any) => {
      try {
        const uid = q?.__knexQueryUid;
        if (uid == null) return;
        requestIds.set(uid, getCurrentRequestId());
        startedAt.set(uid, process.hrtime.bigint());
      } catch {
        // never break the query
      }
    });

    const finalize = (q: any) => {
      try {
        const sql: string = q?.sql ?? "";
        if (!sql) return;

        const uid = q?.__knexQueryUid;
        const start = uid != null ? startedAt.get(uid) : undefined;
        const requestId = uid != null ? requestIds.get(uid) : undefined;
        if (uid != null) {
          startedAt.delete(uid);
          requestIds.delete(uid);
        }

        const took =
          start != null ? Number(process.hrtime.bigint() - start) / 1e6 : undefined;

        watcherEmitter.emit("mikroOrmQuery", {
          query: sql,
          params: Array.isArray(q?.bindings) ? q.bindings : [],
          took,
          requestId,
        });
      } catch {
        // never surface instrumentation errors
      }
    };

    knex.on("query-response", (_response: any, q: any) => finalize(q));
    knex.on("query-error", (_error: any, q: any) => finalize(q));
  }
}
