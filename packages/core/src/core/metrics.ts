import type Store from "../abstracts/store";
import { WatcherTypeEnum, type LensEntry } from "../types/index";
import { nowISO } from "@lensjs/date";
import { parseDurationMs } from "../utils/index";

/** Max rows fetched per signal for a window (a size-pruned dev store is bounded). */
const WINDOW_ROW_CAP = 20_000;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;
const TOP_N = 8;

export type MetricsGranularity = "minute" | "hour" | "day";

export type ThroughputPoint = { bucket: string; total: number; errors: number };
export type LatencyPoint = { bucket: string; avg: number; p95: number };
export type EndpointStat = {
  method: string;
  path: string;
  count: number;
  avg: number;
  p95: number;
};
export type SlowQueryStat = {
  id: string;
  query: string;
  duration: number;
  createdAt: string;
};
export type ExceptionGroupStat = {
  name: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  sampleId: string;
  fingerprint?: string;
};

export type LensOverview = {
  range: { from: string; to: string; granularity: MetricsGranularity };
  summary: {
    totalRequests: number;
    requestsPerMinute: number;
    /** Fraction (0..1) of requests with a 5xx status. */
    errorRate: number;
    /** Fraction (0..1) of requests with a 4xx status. */
    clientErrorRate: number;
    p50: number;
    p95: number;
    p99: number;
    totalExceptions: number;
    totalQueries: number;
    avgQueryTime: number;
  };
  throughput: ThroughputPoint[];
  latencyTrend: LatencyPoint[];
  slowestEndpoints: EndpointStat[];
  slowestQueries: SlowQueryStat[];
  topExceptions: ExceptionGroupStat[];
};

export interface LensMetrics {
  getOverview(params?: { from?: string; to?: string }): Promise<LensOverview>;
}

/** Nearest-rank percentile over an ascending-sorted array. */
function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx] ?? 0;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function granularityFor(fromMs: number, toMs: number): MetricsGranularity {
  const span = toMs - fromMs;
  if (span <= 2 * 60 * 60 * 1000) return "minute";
  if (span <= 3 * 24 * 60 * 60 * 1000) return "hour";
  return "day";
}

/** created_at is ISO-8601 UTC; slice the prefix to bucket by minute/hour/day. */
function bucketKey(createdAt: string, granularity: MetricsGranularity): string {
  if (granularity === "minute") return createdAt.slice(0, 16);
  if (granularity === "hour") return createdAt.slice(0, 13);
  return createdAt.slice(0, 10);
}

/**
 * Collapse exception rows into issues keyed by their `fingerprint` (falling back
 * to name+message), tracking occurrence count and first/last seen. Sorted by
 * count desc; pass `limit` to cap the result.
 */
export function groupExceptions(
  rows: LensEntry[],
  limit?: number,
): ExceptionGroupStat[] {
  const map = new Map<string, ExceptionGroupStat>();

  for (const row of rows) {
    const d = row.data as {
      name?: string;
      message?: string;
      fingerprint?: string;
      createdAt?: string;
    };
    const name = String(d.name ?? "Error");
    const message = String(d.message ?? "");
    const createdAt = d.createdAt ?? row.created_at;
    const key = d.fingerprint || `${name}::${message}`;

    const existing = map.get(key);
    if (existing) {
      existing.count++;
      if (createdAt > existing.lastSeen) {
        existing.lastSeen = createdAt;
        existing.sampleId = row.id;
      }
      if (createdAt < existing.firstSeen) existing.firstSeen = createdAt;
    } else {
      map.set(key, {
        name,
        message,
        count: 1,
        firstSeen: createdAt,
        lastSeen: createdAt,
        sampleId: row.id,
        fingerprint: d.fingerprint,
      });
    }
  }

  const groups = [...map.values()].sort((a, b) => b.count - a.count);
  return limit ? groups.slice(0, limit) : groups;
}

/**
 * Read-only analytics over a {@link Store}. Computes the dashboard overview
 * (throughput, error rate, latency percentiles, slowest endpoints/queries, top
 * exceptions) from the window's entries. Aggregation runs in JS so it works
 * across any store backend; durations are parsed from their display strings.
 */
export function createLensMetrics(store: Store): LensMetrics {
  return {
    async getOverview(params = {}) {
      // Ignore unparseable from/to so a malformed query param can't turn the
      // window — and every metric derived from it — into NaN; fall back to
      // "now" and a 24h-earlier lower bound.
      const to =
        params.to && !Number.isNaN(Date.parse(params.to))
          ? new Date(params.to).toISOString()
          : nowISO();
      const from =
        params.from && !Number.isNaN(Date.parse(params.from))
          ? new Date(params.from).toISOString()
          : new Date(new Date(to).getTime() - DEFAULT_WINDOW_MS).toISOString();

      const window = { from, to, perPage: WINDOW_ROW_CAP };

      const [reqPage, excPage, queryPage] = await Promise.all([
        store.paginate<LensEntry[]>(WatcherTypeEnum.REQUEST, window, false),
        store.paginate<LensEntry[]>(WatcherTypeEnum.EXCEPTION, window, false),
        store.paginate<LensEntry[]>(WatcherTypeEnum.QUERY, window, true),
      ]);

      const requests = reqPage.data ?? [];
      const exceptions = excPage.data ?? [];
      const queries = queryPage.data ?? [];

      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      const granularity = granularityFor(fromMs, toMs);
      const spanMinutes = Math.max(1, (toMs - fromMs) / 60_000);

      const durations: number[] = [];
      const throughputMap = new Map<string, { total: number; errors: number }>();
      const latencyByBucket = new Map<string, number[]>();
      const endpointMap = new Map<
        string,
        { method: string; path: string; durations: number[] }
      >();
      let serverErrors = 0;
      let clientErrors = 0;

      for (const row of requests) {
        const d = row.data as {
          method?: string;
          path?: string;
          status?: number;
          duration?: string;
          createdAt?: string;
        };
        const createdAt = d.createdAt ?? row.created_at;
        const ms = parseDurationMs(d.duration);
        durations.push(ms);

        const status = Number(d.status ?? 0);
        if (status >= 500) serverErrors++;
        else if (status >= 400) clientErrors++;

        const bucket = bucketKey(createdAt, granularity);
        const tp = throughputMap.get(bucket) ?? { total: 0, errors: 0 };
        tp.total++;
        if (status >= 500) tp.errors++;
        throughputMap.set(bucket, tp);

        const lat = latencyByBucket.get(bucket) ?? [];
        lat.push(ms);
        latencyByBucket.set(bucket, lat);

        const method = String(d.method ?? "");
        const path = String(d.path ?? "");
        const key = `${method} ${path}`;
        const ep = endpointMap.get(key) ?? { method, path, durations: [] };
        ep.durations.push(ms);
        endpointMap.set(key, ep);
      }

      const sortedDurations = [...durations].sort((a, b) => a - b);
      const totalRequests = requests.length;

      const throughput: ThroughputPoint[] = [...throughputMap.entries()]
        .map(([bucket, v]) => ({ bucket, total: v.total, errors: v.errors }))
        .sort((a, b) => (a.bucket < b.bucket ? -1 : 1));

      const latencyTrend: LatencyPoint[] = [...latencyByBucket.entries()]
        .map(([bucket, arr]) => {
          const sorted = [...arr].sort((a, b) => a - b);
          return { bucket, avg: mean(sorted), p95: percentile(sorted, 95) };
        })
        .sort((a, b) => (a.bucket < b.bucket ? -1 : 1));

      const slowestEndpoints: EndpointStat[] = [...endpointMap.values()]
        .map((e) => {
          const sorted = [...e.durations].sort((a, b) => a - b);
          return {
            method: e.method,
            path: e.path,
            count: e.durations.length,
            avg: mean(sorted),
            p95: percentile(sorted, 95),
          };
        })
        .sort((a, b) => b.p95 - a.p95)
        .slice(0, TOP_N);

      const slowestQueries: SlowQueryStat[] = queries
        .map((row) => {
          const d = row.data as {
            query?: string;
            duration?: string;
            createdAt?: string;
          };
          return {
            id: row.id,
            query: String(d.query ?? ""),
            duration: parseDurationMs(d.duration),
            createdAt: d.createdAt ?? row.created_at,
          };
        })
        .sort((a, b) => b.duration - a.duration)
        .slice(0, TOP_N);

      const avgQueryTime = mean(
        queries.map((row) =>
          parseDurationMs((row.data as { duration?: string }).duration),
        ),
      );

      const topExceptions = groupExceptions(exceptions, TOP_N);

      return {
        range: { from, to, granularity },
        summary: {
          totalRequests,
          requestsPerMinute: totalRequests / spanMinutes,
          errorRate: totalRequests ? serverErrors / totalRequests : 0,
          clientErrorRate: totalRequests ? clientErrors / totalRequests : 0,
          p50: percentile(sortedDurations, 50),
          p95: percentile(sortedDurations, 95),
          p99: percentile(sortedDurations, 99),
          totalExceptions: exceptions.length,
          totalQueries: queries.length,
          avgQueryTime,
        },
        throughput,
        latencyTrend,
        slowestEndpoints,
        slowestQueries,
        topExceptions,
      };
    },
  };
}
