import { describe, it, expect, beforeEach, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  WatcherTypeEnum,
  type ExceptionGroupStat,
  type LensEntry,
  type LensOverview,
  type LensReader,
  type PaginationParams,
  type Paginator,
} from "@lensjs/core";
import { createLensMcpServer } from "../src/server";

function page(data: LensEntry[]): Paginator<LensEntry[]> {
  return {
    data,
    meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 20 },
  };
}

const requestEntry: LensEntry = {
  id: "req-1",
  type: WatcherTypeEnum.REQUEST,
  created_at: "2025-01-01T00:00:03.000Z",
  lens_entry_id: null,
  data: {
    id: "req-1",
    method: "GET",
    path: "/users/1",
    status: 500,
    duration: "12 ms",
    body: {},
  },
};

const exceptionEntry: LensEntry = {
  id: "exc-1",
  type: WatcherTypeEnum.EXCEPTION,
  created_at: "2025-01-01T00:00:02.000Z",
  lens_entry_id: "req-1",
  data: {
    name: "TypeError",
    message: "Cannot read properties of undefined (reading 'id')",
    fingerprint: "fp-1",
    trace: ["at handler (/app/app.ts:10:5)"],
    fileInfo: { file: "/app/app.ts", function: "handler" },
    codeFrame: {
      file: "/app/app.ts",
      line: 10,
      column: 5,
      context: {
        pre: ["const user = getUser();"],
        error: "return user.id;",
        post: ["}"],
      },
    },
    createdAt: "2025-01-01T00:00:02.000Z",
  },
};

const fastQuery: LensEntry = {
  id: "q-1",
  type: WatcherTypeEnum.QUERY,
  created_at: "2025-01-01T00:00:00.000Z",
  lens_entry_id: "req-1",
  data: { query: "SELECT 1", duration: "2 ms", type: "sqlite" },
};

const slowQuery: LensEntry = {
  id: "q-2",
  type: WatcherTypeEnum.QUERY,
  created_at: "2025-01-01T00:00:01.000Z",
  lens_entry_id: "req-1",
  data: {
    query: "SELECT * FROM big_table",
    duration: "250 ms",
    type: "sqlite",
  },
};

const logEntry: LensEntry = {
  id: "log-1",
  type: WatcherTypeEnum.LOG,
  created_at: "2025-01-01T00:00:04.000Z",
  lens_entry_id: "req-1",
  data: {
    level: "error",
    message: "payment gateway timeout",
    source: "pino",
    createdAt: "2025-01-01T00:00:04.000Z",
  },
};

const jobEntry: LensEntry = {
  id: "job-1",
  type: WatcherTypeEnum.JOB,
  created_at: "2025-01-01T00:00:05.000Z",
  lens_entry_id: null,
  data: {
    name: "send-invoice",
    queue: "billing",
    status: "failed",
    attempts: 3,
    duration: "900 ms",
    createdAt: "2025-01-01T00:00:05.000Z",
  },
};

const cacheEntry: LensEntry = {
  id: "cache-1",
  type: WatcherTypeEnum.CACHE,
  created_at: "2025-01-01T00:00:06.000Z",
  lens_entry_id: "req-1",
  data: { action: "hit", key: "user:1", createdAt: "2025-01-01T00:00:06.000Z" },
};

const overview: LensOverview = {
  range: {
    from: "2025-01-01T00:00:00.000Z",
    to: "2025-01-01T01:00:00.000Z",
    granularity: "minute",
  },
  summary: {
    totalRequests: 10,
    requestsPerMinute: 0.17,
    errorRate: 0.1,
    clientErrorRate: 0,
    p50: 12,
    p95: 250,
    p99: 400,
    totalExceptions: 1,
    totalQueries: 2,
    avgQueryTime: 126,
  },
  throughput: [{ bucket: "2025-01-01T00:00", total: 10, errors: 1 }],
  latencyTrend: [{ bucket: "2025-01-01T00:00", avg: 30, p95: 250 }],
  slowestEndpoints: [
    { method: "GET", path: "/users/:id", count: 10, avg: 30, p95: 250 },
  ],
  slowestQueries: [
    {
      id: "q-2",
      query: "SELECT * FROM big_table",
      duration: 250,
      createdAt: "2025-01-01T00:00:01.000Z",
    },
  ],
  topExceptions: [
    {
      name: "TypeError",
      message: "Cannot read properties of undefined (reading 'id')",
      count: 4,
      firstSeen: "2025-01-01T00:00:00.000Z",
      lastSeen: "2025-01-01T00:00:02.000Z",
      sampleId: "exc-1",
      fingerprint: "fp-1",
    },
  ],
};

const issues: ExceptionGroupStat[] = overview.topExceptions;

const byType = new Map<WatcherTypeEnum, LensEntry[]>([
  [WatcherTypeEnum.REQUEST, [requestEntry]],
  [WatcherTypeEnum.QUERY, [slowQuery, fastQuery]],
  [WatcherTypeEnum.EXCEPTION, [exceptionEntry]],
  [WatcherTypeEnum.LOG, [logEntry]],
  [WatcherTypeEnum.JOB, [jobEntry]],
  [WatcherTypeEnum.CACHE, [cacheEntry]],
]);

const allEntries = [...byType.values()].flat();

/** Records how each read was requested so tests can assert on server-side params. */
const listCalls: Array<{ type: WatcherTypeEnum; pagination: PaginationParams }> = [];

const fakeReader: LensReader = {
  list: vi.fn(async (type: WatcherTypeEnum, pagination: PaginationParams) => {
    listCalls.push({ type, pagination });
    const rows = byType.get(type) ?? [];
    const q = pagination.q?.toLowerCase();
    return page(
      q
        ? rows.filter((row) => JSON.stringify(row.data).toLowerCase().includes(q))
        : rows,
    );
  }),
  latest: async () => page([requestEntry, exceptionEntry, slowQuery]),
  find: async (type, id) =>
    allEntries.find((entry) => entry.type === type && entry.id === id) ?? null,
  count: async (type) => (byType.get(type) ?? []).length,
  getOverview: async () => overview,
  getExceptionGroups: async () => issues,
  getRequestTimeline: async (id) =>
    id === "req-1"
      ? {
          request: requestEntry,
          queries: [fastQuery, slowQuery],
          cacheEntries: [cacheEntry],
          exceptions: [exceptionEntry],
          emails: [],
          httpEntries: [],
          eventEntries: [],
          redisEntries: [],
          fcmEntries: [],
          logEntries: [logEntry],
          jobEntries: [],
        }
      : null,
};

// callTool returns a union (modern + compatibility shapes); read text loosely.
function firstText(result: any): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content?.[0]?.text ?? "";
}

function lastCall() {
  return listCalls[listCalls.length - 1]!;
}

describe("Lens MCP server", () => {
  let client: Client;

  beforeEach(async () => {
    listCalls.length = 0;
    const server = createLensMcpServer(fakeReader, { version: "test" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  async function call(name: string, args: Record<string, unknown> = {}) {
    return JSON.parse(firstText(await client.callTool({ name, arguments: args })));
  }

  it("exposes the read-only tool set", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "lens_stats",
        "lens_overview",
        "lens_list_issues",
        "lens_list_exceptions",
        "lens_get_exception",
        "lens_list_requests",
        "lens_get_request",
        "lens_list_queries",
        "lens_get_query",
        "lens_list_slow_queries",
        "lens_list_logs",
        "lens_list_jobs",
        "lens_list_entries",
        "lens_get_entry",
        "lens_search",
      ]),
    );
    expect(tools.every((tool) => tool.annotations?.readOnlyHint)).toBe(true);
  });

  it("counts every signal type via lens_stats", async () => {
    const payload = await call("lens_stats");

    expect(payload.counts).toMatchObject({
      request: 1,
      exception: 1,
      log: 1,
      job: 1,
      cache: 1,
      mail: 0,
      fcm: 0,
    });
  });

  it("returns the aggregated overview for a window", async () => {
    const payload = await call("lens_overview", {
      from: "2025-01-01T00:00:00.000Z",
    });

    expect(payload.summary.p95).toBe(250);
    expect(payload.slowestEndpoints[0].path).toBe("/users/:id");
  });

  it("ranks distinct issues by occurrence count", async () => {
    const payload = await call("lens_list_issues");

    expect(payload.issues[0]).toMatchObject({
      fingerprint: "fp-1",
      count: 4,
      sampleId: "exc-1",
    });
  });

  it("returns full exception detail with its code frame and request", async () => {
    const payload = await call("lens_get_exception", { id: "exc-1" });

    expect(payload.exception.data.name).toBe("TypeError");
    expect(payload.exception.data.codeFrame.context.error).toBe("return user.id;");
    expect(payload.request.id).toBe("req-1");
  });

  it("flags a missing exception as a tool error", async () => {
    const result = await client.callTool({
      name: "lens_get_exception",
      arguments: { id: "nope" },
    });

    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain("No exception found");
  });

  it("returns the full request timeline including logs", async () => {
    const payload = await call("lens_get_request", { id: "req-1" });

    expect(payload.request.id).toBe("req-1");
    expect(payload.queries).toHaveLength(2);
    expect(payload.exceptions).toHaveLength(1);
    expect(payload.logEntries).toHaveLength(1);
  });

  it("pushes request filters and sorting to the store, not the page", async () => {
    await call("lens_list_requests", {
      minStatus: 500,
      method: "get",
      search: "/users",
      from: "2025-01-01T00:00:00.000Z",
      sortBy: "duration",
    });

    const { type, pagination } = lastCall();
    expect(type).toBe(WatcherTypeEnum.REQUEST);
    expect(pagination.filters).toEqual([
      { field: "status", op: "gte", value: "500" },
      { field: "method", op: "eq", value: "GET" },
    ]);
    expect(pagination.q).toBe("/users");
    expect(pagination.from).toBe("2025-01-01T00:00:00.000Z");
    expect(pagination).toMatchObject({ sort: "duration", numericSort: true });
  });

  it("asks the store for slow queries sorted by duration", async () => {
    const payload = await call("lens_list_slow_queries", { thresholdMs: 100 });

    const { type, pagination } = lastCall();
    expect(type).toBe(WatcherTypeEnum.QUERY);
    expect(pagination.filters).toEqual([
      { field: "duration", op: "gte", value: "100" },
    ]);
    expect(pagination).toMatchObject({
      sort: "duration",
      dir: "desc",
      numericSort: true,
    });
    expect(payload.slowQueries[0].id).toBe("q-2");
  });

  it("filters log entries by level", async () => {
    const payload = await call("lens_list_logs", { level: "error" });

    expect(lastCall().type).toBe(WatcherTypeEnum.LOG);
    expect(lastCall().pagination.filters).toEqual([
      { field: "level", op: "eq", value: "error" },
    ]);
    expect(payload.logs[0].data.message).toBe("payment gateway timeout");
  });

  it("filters background jobs by status and queue", async () => {
    const payload = await call("lens_list_jobs", {
      status: "failed",
      queue: "billing",
    });

    expect(lastCall().pagination.filters).toEqual([
      { field: "status", op: "eq", value: "failed" },
      { field: "queue", op: "eq", value: "billing" },
    ]);
    expect(payload.jobs[0].data.name).toBe("send-invoice");
  });

  it("lists and fetches a signal without a dedicated tool", async () => {
    const listed = await call("lens_list_entries", {
      type: WatcherTypeEnum.CACHE,
    });
    expect(listed.entries[0].id).toBe("cache-1");

    const fetched = await call("lens_get_entry", {
      type: WatcherTypeEnum.CACHE,
      id: "cache-1",
    });
    expect(fetched.data.key).toBe("user:1");
  });

  it("searches every signal type server-side, newest first", async () => {
    const payload = await call("lens_search", { query: "big_table" });

    expect(payload.matches).toHaveLength(1);
    expect(payload.matches[0].id).toBe("q-2");
    // The search term is handed to the store rather than filtered in memory.
    expect(listCalls.every((call) => call.pagination.q === "big_table")).toBe(true);
  });

  it("scopes a search to the requested types", async () => {
    await call("lens_search", {
      query: "timeout",
      types: [WatcherTypeEnum.LOG],
    });

    expect(listCalls.map((call) => call.type)).toEqual([WatcherTypeEnum.LOG]);
  });

  it("builds a diagnose_exception prompt with the code frame and request context", async () => {
    const result = await client.getPrompt({
      name: "diagnose_exception",
      arguments: { id: "exc-1" },
    });
    const text = (result.messages[0]?.content as { text: string }).text;

    expect(text).toContain("TypeError");
    expect(text).toContain("return user.id;");
    expect(text).toContain("GET /users/1 -> 500");
    expect(text.toLowerCase()).toContain("root cause");
  });

  it("builds an analyze_performance prompt from the overview", async () => {
    const result = await client.getPrompt({ name: "analyze_performance" });
    const text = (result.messages[0]?.content as { text: string }).text;

    expect(text).toContain("p95 250.0 ms");
    expect(text).toContain("GET /users/:id");
    expect(text).toContain("SELECT * FROM big_table");
  });

  it("builds an investigate_issue prompt with frequency and the latest occurrence", async () => {
    const result = await client.getPrompt({
      name: "investigate_issue",
      arguments: { fingerprint: "fp-1" },
    });
    const text = (result.messages[0]?.content as { text: string }).text;

    expect(text).toContain("4 occurrences");
    expect(text).toContain("return user.id;");
  });

  it("tells the agent how to recover from an unknown issue fingerprint", async () => {
    const result = await client.getPrompt({
      name: "investigate_issue",
      arguments: { fingerprint: "nope" },
    });
    const text = (result.messages[0]?.content as { text: string }).text;

    expect(text).toContain("lens_list_issues");
  });

  it("reads an exception as a resource", async () => {
    const result = await client.readResource({
      uri: "lens://exception/exc-1",
    });
    const payload = JSON.parse(
      (result.contents[0] as { text?: string })?.text ?? "{}",
    );

    expect(payload.data.name).toBe("TypeError");
  });

  it("reads the overview as a resource", async () => {
    const result = await client.readResource({ uri: "lens://overview" });
    const payload = JSON.parse(
      (result.contents[0] as { text?: string })?.text ?? "{}",
    );

    expect(payload.summary.totalRequests).toBe(10);
  });
});
