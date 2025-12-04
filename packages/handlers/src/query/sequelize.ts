import { lensUtils } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
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
  payload: { sql: string; timing?: number };
  provider: SequelizeQueryType;
}) {
  if (typeof payload.sql !== "string") {
    throw new Error("payload.sql must be a string");
  }

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
      onQuery(sequelizeEventHandler({ payload: e, provider }));
    });
  };
}
