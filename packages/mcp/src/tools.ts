import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  WatcherTypeEnum,
  type LensEntry,
  type LensReader,
  type ListFilter,
  type PaginationParams,
} from "@lensjs/core";
import { z } from "zod";
import { clampLimit, jsonContent, notFound, toPage } from "./format";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

/** Every signal Lens can capture, in the order `lens_stats` reports them. */
const ALL_TYPES = [
  WatcherTypeEnum.REQUEST,
  WatcherTypeEnum.QUERY,
  WatcherTypeEnum.EXCEPTION,
  WatcherTypeEnum.LOG,
  WatcherTypeEnum.JOB,
  WatcherTypeEnum.CACHE,
  WatcherTypeEnum.MAIL,
  WatcherTypeEnum.HTTP,
  WatcherTypeEnum.EVENT,
  WatcherTypeEnum.REDIS,
  WatcherTypeEnum.FCM,
] as const;

const listShape = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum number of entries to return (1-100, default 20)."),
  cursor: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Opaque cursor from a previous response's nextCursor, to page to older entries.",
    ),
  search: z
    .string()
    .optional()
    .describe(
      "Case-insensitive substring match, applied server-side across the whole dataset (not just this page).",
    ),
  from: z
    .string()
    .optional()
    .describe("ISO-8601 lower bound on capture time, e.g. 2025-01-01T00:00:00Z."),
  to: z.string().optional().describe("ISO-8601 upper bound on capture time."),
};

const windowShape = {
  from: z
    .string()
    .optional()
    .describe("ISO-8601 start of the window (default: 24 hours ago)."),
  to: z.string().optional().describe("ISO-8601 end of the window (default: now)."),
};

const idShape = (kind: string) => ({
  id: z.string().min(1).describe(`The ${kind} id.`),
});

type ListArgs = {
  limit?: number;
  cursor?: number;
  search?: string;
  from?: string;
  to?: string;
};

function toPagination(args: ListArgs, extra?: Partial<PaginationParams>): PaginationParams {
  return {
    perPage: clampLimit(args.limit),
    cursor: args.cursor ?? undefined,
    q: args.search,
    from: args.from,
    to: args.to,
    ...extra,
  };
}

/** Build the `minimal_data` filters for a set of optional equality/range args. */
function filtersFrom(
  entries: Array<[field: string, op: ListFilter["op"], value: unknown]>,
): ListFilter[] {
  return entries
    .filter(([, , value]) => value !== undefined && value !== null && value !== "")
    .map(([field, op, value]) => ({ field, op, value: String(value) }));
}

/**
 * Register the read-only Lens tools on an MCP server. Every tool maps onto the
 * {@link LensReader}, which mirrors the dashboard's read surface, so no tool can
 * return more than the dashboard already exposes or mutate any state.
 */
export function registerLensTools(server: McpServer, reader: LensReader): void {
  server.registerTool(
    "lens_stats",
    {
      title: "Lens stats",
      description:
        "Count of entries Lens has captured per signal type (requests, queries, exceptions, logs, jobs, cache, mail, outbound http, events, redis, fcm). Start here to see whether there is anything to investigate.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async () => {
      const counts: Record<string, number> = {};
      for (const type of ALL_TYPES) {
        counts[type] = await reader.count(type);
      }

      return jsonContent({ counts });
    },
  );

  server.registerTool(
    "lens_overview",
    {
      title: "Application overview",
      description:
        "Aggregated health for a time window: request throughput and error rate, latency p50/p95/p99, slowest endpoints, slowest queries, and the most frequent exception issues. The fastest way to answer 'how is the app doing?' or 'what got slower?'.",
      inputSchema: windowShape,
      annotations: READ_ONLY,
    },
    async ({ from, to }) => jsonContent(await reader.getOverview({ from, to })),
  );

  server.registerTool(
    "lens_list_issues",
    {
      title: "List exception issues",
      description:
        "Exceptions collapsed into issues by fingerprint, most frequent first, with occurrence count and first/last seen. Use this instead of lens_list_exceptions when one error repeats and you want distinct problems. Each issue carries a sampleId for lens_get_exception.",
      inputSchema: {
        ...windowShape,
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of issues to return (default 20)."),
      },
      annotations: READ_ONLY,
    },
    async ({ from, to, limit }) => {
      const issues = await reader.getExceptionGroups({
        from,
        to,
        limit: clampLimit(limit),
      });

      return jsonContent({ issues });
    },
  );

  server.registerTool(
    "lens_list_exceptions",
    {
      title: "List exceptions",
      description:
        "List captured exceptions, newest first (id, name, message, fingerprint, time). Use lens_get_exception for the full stack trace and code frame, or lens_list_issues to group repeats.",
      inputSchema: {
        ...listShape,
        fingerprint: z
          .string()
          .optional()
          .describe(
            "Only occurrences of this issue fingerprint (from lens_list_issues).",
          ),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      const page = await reader.list(
        WatcherTypeEnum.EXCEPTION,
        toPagination(args, {
          filters: filtersFrom([["fingerprint", "eq", args.fingerprint]]),
        }),
      );

      return jsonContent(toPage("exceptions", page));
    },
  );

  server.registerTool(
    "lens_get_exception",
    {
      title: "Get exception",
      description:
        "Fetch one exception by id with its full detail: message, stack trace, source file, and the code frame (surrounding source lines) where it was thrown. Also includes the request that triggered it, when known.",
      inputSchema: idShape("exception"),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const exception = await reader.find(WatcherTypeEnum.EXCEPTION, id);
      if (!exception) return notFound("exception", id);

      const requestId = exception.lens_entry_id;
      const request = requestId
        ? await reader.find(WatcherTypeEnum.REQUEST, requestId)
        : null;

      return jsonContent({ exception, request });
    },
  );

  server.registerTool(
    "lens_list_requests",
    {
      title: "List requests",
      description:
        "List captured HTTP requests, newest first (method, path, status, duration). Filters run server-side across the whole dataset: use minStatus 500 for failures, or sortBy 'duration' for the slowest requests.",
      inputSchema: {
        ...listShape,
        status: z
          .number()
          .int()
          .optional()
          .describe("Only requests whose response status equals this code."),
        minStatus: z
          .number()
          .int()
          .optional()
          .describe("Only requests with status >= this code (e.g. 500 for errors)."),
        method: z
          .string()
          .optional()
          .describe("Only requests with this HTTP method (GET, POST, ...)."),
        sortBy: z
          .enum(["time", "duration", "status"])
          .optional()
          .describe("Sort field (default 'time', newest first)."),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      const sortBy = args.sortBy ?? "time";
      const page = await reader.list(
        WatcherTypeEnum.REQUEST,
        toPagination(args, {
          filters: filtersFrom([
            ["status", "eq", args.status],
            ["status", "gte", args.minStatus],
            ["method", "eq", args.method?.toUpperCase()],
          ]),
          sort: sortBy,
          numericSort: sortBy !== "time",
        }),
      );

      return jsonContent(toPage("requests", page));
    },
  );

  server.registerTool(
    "lens_get_request",
    {
      title: "Get request timeline",
      description:
        "Fetch one request by id with everything correlated to it: the request/response, every SQL query (with duration), cache operations, exceptions, outbound HTTP calls, sent mail, log lines, background jobs, events, redis, and fcm. The best tool for debugging a specific request.",
      inputSchema: idShape("request"),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const timeline = await reader.getRequestTimeline(id);
      if (!timeline) return notFound("request", id);
      return jsonContent(timeline);
    },
  );

  server.registerTool(
    "lens_list_queries",
    {
      title: "List queries",
      description:
        "List captured database queries, newest first (SQL/text, type, duration). Set minDurationMs or sortBy 'duration' to hunt for slow queries across the whole dataset.",
      inputSchema: {
        ...listShape,
        minDurationMs: z
          .number()
          .min(0)
          .optional()
          .describe("Only queries at or above this duration in milliseconds."),
        sortBy: z
          .enum(["time", "duration"])
          .optional()
          .describe("Sort field (default 'time', newest first)."),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      const sortBy = args.sortBy ?? "time";
      const page = await reader.list(
        WatcherTypeEnum.QUERY,
        toPagination(args, {
          filters: filtersFrom([["duration", "gte", args.minDurationMs]]),
          sort: sortBy,
          numericSort: sortBy === "duration",
        }),
        true,
      );

      return jsonContent(toPage("queries", page));
    },
  );

  server.registerTool(
    "lens_get_query",
    {
      title: "Get query",
      description:
        "Fetch one database query by id with its full detail (SQL, bindings, duration, and the request it ran in).",
      inputSchema: idShape("query"),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const query = await reader.find(WatcherTypeEnum.QUERY, id);
      if (!query) return notFound("query", id);
      return jsonContent(query);
    },
  );

  server.registerTool(
    "lens_list_slow_queries",
    {
      title: "List slow queries",
      description:
        "The slowest database queries at or above thresholdMs, slowest first. Sorted server-side over the whole dataset, so it finds slow queries even if they are old. Useful for spotting performance problems and N+1 patterns.",
      inputSchema: {
        ...windowShape,
        thresholdMs: z
          .number()
          .min(0)
          .optional()
          .describe("Minimum query duration in milliseconds (default 100)."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of queries to return (default 20)."),
      },
      annotations: READ_ONLY,
    },
    async ({ thresholdMs, limit, from, to }) => {
      const threshold = thresholdMs ?? 100;
      const page = await reader.list(
        WatcherTypeEnum.QUERY,
        {
          perPage: clampLimit(limit),
          from,
          to,
          filters: [{ field: "duration", op: "gte", value: String(threshold) }],
          sort: "duration",
          dir: "desc",
          numericSort: true,
        },
        true,
      );

      return jsonContent({ thresholdMs: threshold, slowQueries: page.data });
    },
  );

  server.registerTool(
    "lens_list_logs",
    {
      title: "List log entries",
      description:
        "List captured application log lines, newest first (level, message, source). Filter by level to isolate errors, or by search to find a specific message.",
      inputSchema: {
        ...listShape,
        level: z
          .enum(["fatal", "error", "warn", "info", "debug", "trace"])
          .optional()
          .describe("Only log entries at this level."),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      const page = await reader.list(
        WatcherTypeEnum.LOG,
        toPagination(args, {
          filters: filtersFrom([["level", "eq", args.level]]),
        }),
      );

      return jsonContent(toPage("logs", page));
    },
  );

  server.registerTool(
    "lens_list_jobs",
    {
      title: "List background jobs",
      description:
        "List captured background jobs, newest first (name, queue, status, attempts, duration). Filter by status 'failed' to find failing jobs, or by queue/name to scope to one worker.",
      inputSchema: {
        ...listShape,
        status: z
          .enum(["queued", "active", "completed", "failed"])
          .optional()
          .describe("Only jobs in this state."),
        queue: z.string().optional().describe("Only jobs on this queue."),
        name: z.string().optional().describe("Only jobs with this exact name."),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      const page = await reader.list(
        WatcherTypeEnum.JOB,
        toPagination(args, {
          filters: filtersFrom([
            ["status", "eq", args.status],
            ["queue", "eq", args.queue],
            ["name", "eq", args.name],
          ]),
        }),
      );

      return jsonContent(toPage("jobs", page));
    },
  );

  server.registerTool(
    "lens_list_entries",
    {
      title: "List entries of any signal",
      description:
        "List captured entries of any signal type, newest first. Use it for the signals without a dedicated tool: cache operations, sent mail, outbound HTTP calls, events, redis commands, and FCM messages.",
      inputSchema: {
        ...listShape,
        type: z
          .nativeEnum(WatcherTypeEnum)
          .describe(
            "Signal type to list (cache, mail, http, event, redis, fcm, request, query, exception, log, job).",
          ),
      },
      annotations: READ_ONLY,
    },
    async ({ type, ...args }) => {
      const page = await reader.list(type, toPagination(args));
      return jsonContent({ type, ...toPage("entries", page) });
    },
  );

  server.registerTool(
    "lens_get_entry",
    {
      title: "Get an entry of any signal",
      description:
        "Fetch the full detail of one captured entry by signal type and id — the counterpart to lens_list_entries for cache, mail, outbound HTTP, events, redis, FCM, logs, and jobs.",
      inputSchema: {
        type: z.nativeEnum(WatcherTypeEnum).describe("Signal type of the entry."),
        ...idShape("entry"),
      },
      annotations: READ_ONLY,
    },
    async ({ type, id }) => {
      const entry = await reader.find(type, id);
      if (!entry) return notFound(type, id);
      return jsonContent(entry);
    },
  );

  server.registerTool(
    "lens_search",
    {
      title: "Search captured entries",
      description:
        "Substring search across captured entries of every signal type (or the types you name), matched server-side over the whole dataset and returned newest first. Use it when you know a path, message, SQL fragment, or cache key but not which signal recorded it.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Substring to search for (case-insensitive)."),
        types: z
          .array(z.nativeEnum(WatcherTypeEnum))
          .optional()
          .describe("Restrict the search to these signal types."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of matches to return (default 20)."),
        ...windowShape,
      },
      annotations: READ_ONLY,
    },
    async ({ query, types, limit, from, to }) => {
      const searched = types?.length ? types : [...ALL_TYPES];
      const perPage = clampLimit(limit);

      const pages = await Promise.all(
        searched.map((type) =>
          reader.list(type, { perPage, q: query, from, to }),
        ),
      );

      const matches = pages
        .flatMap((page) => (page.data ?? []) as LensEntry[])
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, perPage);

      return jsonContent({ query, types: searched, matches });
    },
  );
}
