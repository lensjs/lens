import { durationToMs } from "./format";

/** Queries at or above this many ms are flagged "slow". */
export const SLOW_QUERY_MS = 500;

/** A query shape repeated at least this many times in one request is an N+1. */
const N_PLUS_ONE_THRESHOLD = 3;

export type QueryFlags = {
  slow: boolean;
  duplicate: boolean;
  nPlusOne: boolean;
};

export type QueryLike = {
  query: string;
  type?: string;
  duration?: string;
};

/**
 * Normalize a query for shape-grouping: SQL string/number literals become `?`,
 * `IN (...)` lists collapse, and whitespace is squashed; mongo operations drop
 * their argument payload. This lets N+1 detection group same-shaped queries that
 * differ only by their literals.
 */
export function normalizeQuery(query: string, type?: string): string {
  if (!query) return "";

  if (type === "mongodb") {
    return query.replace(/\([\s\S]*\)/, "(?)").trim();
  }

  return query
    .replace(/'(?:[^']|'')*'/g, "?")
    .replace(/\b\d+(\.\d+)?\b/g, "?")
    .replace(/\s+/g, " ")
    .replace(/\bin\s*\((?:\s*\?\s*,?)+\)/gi, "IN (?)")
    .trim()
    .toLowerCase();
}

/**
 * Flag slow, duplicate (identical text repeated), and N+1 (same shape repeated)
 * queries within a single request. Runs client-side over the request's complete
 * query set, so it needs no server round-trip.
 */
export function analyzeQueries(queries: QueryLike[]): {
  flags: QueryFlags[];
  summary: { total: number; slow: number; duplicate: number; nPlusOne: number };
} {
  const exactCounts = new Map<string, number>();
  const normCounts = new Map<string, number>();

  const keys = queries.map((q) => {
    const exact = q.query ?? "";
    const norm = normalizeQuery(exact, q.type);
    exactCounts.set(exact, (exactCounts.get(exact) ?? 0) + 1);
    normCounts.set(norm, (normCounts.get(norm) ?? 0) + 1);
    return { exact, norm };
  });

  const flags: QueryFlags[] = queries.map((q, i) => {
    const key = keys[i]!;
    return {
      slow: durationToMs(q.duration) >= SLOW_QUERY_MS,
      duplicate: (exactCounts.get(key.exact) ?? 0) >= 2,
      nPlusOne: (normCounts.get(key.norm) ?? 0) >= N_PLUS_ONE_THRESHOLD,
    };
  });

  return {
    flags,
    summary: {
      total: queries.length,
      slow: flags.filter((f) => f.slow).length,
      duplicate: flags.filter((f) => f.duplicate).length,
      nPlusOne: flags.filter((f) => f.nPlusOne).length,
    },
  };
}
