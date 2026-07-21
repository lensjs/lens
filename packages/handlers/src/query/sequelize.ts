import { getCurrentRequestId, lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { isTransactionQuery } from "../utils/query";
import { QueryWatcherHandler, SequelizeQueryType } from "../types";
import { now } from "@lensjs/date";

export function normalizeSql(sql: string) {
  return sql.replace(/^Executed \(default\):\s*/, "");
}

export function normalizeQuery(query: string): { sql: string; params: any } {
  const queryWithParams = normalizeSql(query)
    .split(";")
    .filter((i) => i !== "");

  if (queryWithParams.length === 1) {
    return { sql: queryWithParams[0] as string, params: [] };
  }

  const sql = queryWithParams[0] as string;
  let stringParams = queryWithParams[1] as string;
  let params: any;

  try {
    const isParamsObject = stringParams.trim().startsWith("{");

    if (isParamsObject) {
      params = JSON.parse(stringParams);
    } else {
      params = stringParams.split(",").map((item) => JSON.parse(item));
    }
  } catch (_e) {
    throw new Error("Failed to extract params from query");
  }

  return { sql, params };
}

export function sequelizeEventHandler({
  payload,
  provider,
}: {
  payload: {
    sql: string;
    timing?: number;
    bind?: readonly unknown[] | Record<string, unknown>;
  };
  provider: SequelizeQueryType;
}) {
  if (typeof payload.sql !== "string") {
    throw new Error("payload.sql must be a string");
  }

  // Hook-based path (attachSequelizeLens): raw SQL with optional bind params.
  if (payload.bind !== undefined) {
    const timing = typeof payload.timing === "number" ? payload.timing : 0;
    const bind: any = payload.bind;
    const hasBind = Array.isArray(bind)
      ? bind.length > 0
      : !!bind && typeof bind === "object" && Object.keys(bind).length > 0;

    // Interpolation/formatting must never throw into the query path.
    let sql = payload.sql;
    if (hasBind) {
      try {
        sql = lensUtils.interpolateQuery(payload.sql, bind);
      } catch {
        sql = payload.sql;
      }
    }

    let query: string;
    try {
      query = lensUtils.formatSqlQuery(sql, provider);
    } catch {
      query = sql;
    }

    return {
      query,
      duration: `${timing.toFixed(1)} ms`,
      type: provider,
      createdAt: `${now()}`,
    };
  }

  // Legacy logging path: "<sql>;<params>" produced by Sequelize's `logging`.
  if (typeof payload.timing !== "number") {
    throw new Error("payload.timing must be a number");
  }

  const { sql, params } = normalizeQuery(payload.sql);

  return {
    query: lensUtils.formatSqlQuery(
      lensUtils.interpolateQuery(sql, params),
      provider,
    ),
    duration: `${payload.timing.toFixed(1)} ms`,
    type: provider,
    createdAt: `${now()}`,
  };
}

export function createSequelizeHandler({
  provider,
}: {
  provider: SequelizeQueryType;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
    watcherEmitter.on("sequelizeQuery", (e) => {
      if (typeof e.sql === "string" && isTransactionQuery(normalizeSql(e.sql))) {
        return;
      }

      // Prefer the in-context id captured by the hooks; fall back to the async
      // context for the legacy `logging` wiring.
      const requestId = e.requestId ?? getCurrentRequestId();

      onQuery(sequelizeEventHandler({ payload: e, provider }), requestId);
    });
  };
}

/**
 * Attach Lens to a Sequelize instance so queries correlate to the request that
 * issued them. Sequelize's `logging` callback fires from the driver's detached
 * completion context (the async context is lost for real/pooled databases), so
 * the request id is captured IN-CONTEXT inside the `beforeQuery` hook and carried
 * on the query `options` to `afterQuery`, where the event is emitted. Use this
 * instead of wiring `logging` manually.
 *
 * ```ts
 * const sequelize = new Sequelize(...);
 * attachSequelizeLens(sequelize);
 * // handler: createSequelizeHandler({ provider: "mysql" })
 * ```
 */
export function attachSequelizeLens(sequelize: {
  addHook: (event: string, fn: (...args: any[]) => void) => void;
}) {
  sequelize.addHook("beforeQuery", (options: any) => {
    if (options && typeof options === "object") {
      options.__lensRequestId = getCurrentRequestId();
      options.__lensStart = process.hrtime.bigint();
    }
  });

  sequelize.addHook("afterQuery", (options: any, query: any) => {
    // Instrumentation must never break a real query, so guard everything.
    try {
      const sql: string =
        (query && query.sql) || (options && options.sql) || "";
      if (!sql) return;

      const bind = (query && query.bind) ?? (options && options.bind) ?? [];
      const start = options && options.__lensStart;
      const timing =
        start != null ? Number(process.hrtime.bigint() - start) / 1e6 : 0;

      watcherEmitter.emit("sequelizeQuery", {
        sql,
        bind,
        timing,
        requestId: options ? options.__lensRequestId : undefined,
      });
    } catch {
      // swallow — never surface instrumentation errors to the caller
    }
  });
}
