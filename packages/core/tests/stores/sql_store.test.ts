import { describe, it, expect, vi, beforeEach } from "vitest";
import SqlStore from "../../src/stores/sql/sql_store";
import { createPostgresDialect } from "../../src/stores/sql/postgres";
import { createMysqlDialect } from "../../src/stores/sql/mysql";
import { WatcherTypeEnum } from "../../src/types";
import { lensStream } from "../../src/utils/event_emitter";

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-01-01T00:00:00.000Z"),
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "mock-uuid"),
}));

const row = (over: Record<string, any> = {}) => ({
  __cursor: 5,
  seq: 5,
  id: "e1",
  data: '{"k":"v"}',
  minimal_data: '{"m":"d"}',
  type: WatcherTypeEnum.REQUEST,
  created_at: "now",
  lens_entry_id: null,
  ...over,
});

/** Postgres: a pool exposing `query(sql, params) -> { rows }`. */
function makePgPool() {
  return { query: vi.fn(async () => ({ rows: [] })) };
}

/** MySQL: a pool exposing `execute(sql, params) -> [rows]`. */
function makeMysqlPool() {
  return { execute: vi.fn(async () => [[]]) };
}

describe("SqlStore (postgres dialect)", () => {
  let store: SqlStore;
  let pool: ReturnType<typeof makePgPool>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    pool = makePgPool();
    store = new SqlStore({ dialect: "postgres", pool });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await store.initialize();
    pool.query.mockClear();
  });

  it("creates the schema on initialize", async () => {
    const fresh = makePgPool();
    const s = new SqlStore({ dialect: "postgres", pool: fresh });
    await s.initialize();

    const statements = fresh.query.mock.calls.map((c) => c[0] as string);
    expect(statements.some((sql) => /CREATE TABLE IF NOT EXISTS lens_entries/.test(sql))).toBe(true);
    expect(statements.some((sql) => /seq BIGSERIAL PRIMARY KEY/.test(sql))).toBe(true);
    expect(statements.some((sql) => /CREATE INDEX IF NOT EXISTS lens_entries_type_seq_idx/.test(sql))).toBe(true);
  });

  it("upserts with DELETE then INSERT and emits the new seq", async () => {
    const emitSpy = vi.spyOn(lensStream, "emit").mockImplementation(() => {});
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // DELETE
      .mockResolvedValueOnce({ rows: [{ seq: 123 }] }); // INSERT ... RETURNING seq

    await store.save({
      id: "job-1",
      data: { full: true },
      minimal_data: { status: "active" },
      type: WatcherTypeEnum.JOB,
      requestId: "req-1",
    });

    const [deleteSql, deleteParams] = pool.query.mock.calls[0]!;
    expect(deleteSql).toBe("DELETE FROM lens_entries WHERE id = $1");
    expect(deleteParams).toEqual(["job-1"]);

    const [insertSql, insertParams] = pool.query.mock.calls[1]!;
    expect(insertSql).toContain(
      "INSERT INTO lens_entries (id, data, type, created_at, lens_entry_id, minimal_data) VALUES ($1, $2, $3, $4, $5, $6)",
    );
    expect(insertSql).toContain("RETURNING seq");
    expect(insertParams).toEqual([
      "job-1",
      '{"full":true}',
      WatcherTypeEnum.JOB,
      "2025-01-01T00:00:00.000Z",
      "req-1",
      '{"status":"active"}',
    ]);

    expect(emitSpy).toHaveBeenCalledWith("entry", {
      cursor: 123,
      entry: {
        id: "job-1",
        type: WatcherTypeEnum.JOB,
        created_at: "2025-01-01T00:00:00.000Z",
        lens_entry_id: "req-1",
        data: { status: "active" },
      },
    });
  });

  it("generates an id and timestamp when omitted", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ seq: 1 }] });

    await store.save({ data: { foo: "bar" }, type: WatcherTypeEnum.REQUEST });

    expect(pool.query.mock.calls[0]![1]).toEqual(["mock-uuid"]);
    const insertParams = pool.query.mock.calls[1]![1] as any[];
    expect(insertParams[0]).toBe("mock-uuid");
    expect(insertParams[3]).toBe("2025-01-01T00:00:00.000Z");
    expect(insertParams[4]).toBeNull();
  });

  it("returns the newest page with cursor meta", async () => {
    pool.query.mockResolvedValueOnce({ rows: [row({ __cursor: 42, seq: 42 })] });

    const result = await store.paginate(WatcherTypeEnum.REQUEST, { perPage: 5 });

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain("SELECT seq AS __cursor,");
    expect(sql).toContain("WHERE type = $1 ORDER BY seq DESC LIMIT $2");
    expect(params).toEqual([WatcherTypeEnum.REQUEST, 6]);
    expect(result.meta).toEqual({
      nextCursor: null,
      headCursor: 42,
      hasMore: false,
      perPage: 5,
    });
  });

  it("pages older rows with `cursor` (seq <) and reports hasMore", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [row({ __cursor: 50, seq: 50 }), row({ __cursor: 49, seq: 49 })],
    });

    const result = await store.paginate(WatcherTypeEnum.REQUEST, {
      cursor: 100,
      perPage: 1,
    });

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain("WHERE type = $1 AND seq < $2 ORDER BY seq DESC LIMIT $3");
    expect(params).toEqual([WatcherTypeEnum.REQUEST, 100, 2]);
    expect(result.meta).toEqual({
      nextCursor: 50,
      headCursor: 50,
      hasMore: true,
      perPage: 1,
    });
  });

  it("pages newer rows with `after` (seq >) for the live feed", async () => {
    pool.query.mockResolvedValueOnce({ rows: [row({ __cursor: 70, seq: 70 })] });

    const result = await store.paginate(WatcherTypeEnum.REQUEST, {
      after: 68,
      perPage: 5,
    });

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain("WHERE type = $1 AND seq > $2 ORDER BY seq DESC LIMIT $3");
    expect(params).toEqual([WatcherTypeEnum.REQUEST, 68, 6]);
    expect(result.meta).toEqual({
      nextCursor: null,
      headCursor: 70,
      hasMore: false,
      perPage: 5,
    });
  });

  it("applies eq / range / search / date filters as bound clauses", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      from: "2025-01-01T00:00:00.000Z",
      to: "2025-01-02T00:00:00.000Z",
      filters: [
        { field: "method", op: "eq", value: "GET" },
        { field: "status", op: "gte", value: "200" },
      ],
      q: "users",
    });

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain("created_at >= $2");
    expect(sql).toContain("created_at <= $3");
    expect(sql).toContain("(minimal_data ->> 'method') = $4");
    expect(sql).toContain(
      "NULLIF(substring(minimal_data ->> 'status' from '^[0-9.]+'), '')::double precision >= $5",
    );
    expect(sql).toContain("minimal_data::text ILIKE $6");
    expect(params).toEqual([
      WatcherTypeEnum.REQUEST,
      "2025-01-01T00:00:00.000Z",
      "2025-01-02T00:00:00.000Z",
      "GET",
      200,
      "%users%",
      6,
    ]);
  });

  it("ignores filters with unsafe field names", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      filters: [{ field: "a; DROP TABLE x", op: "eq", value: "1" }],
    });

    const [sql] = pool.query.mock.calls[0]!;
    expect(sql).toContain("WHERE type = $1 ORDER BY seq DESC");
    expect(sql).not.toContain("->>");
  });

  it("switches to offset ordering for a custom numeric sort", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      sort: "duration",
      dir: "desc",
      numericSort: true,
      cursor: 5,
    });

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain(
      "ORDER BY NULLIF(substring(minimal_data ->> 'duration' from '^[0-9.]+'), '')::double precision DESC, seq DESC LIMIT $2 OFFSET $3",
    );
    expect(params).toEqual([WatcherTypeEnum.REQUEST, 6, 5]);
  });

  it("lower-cases a non-numeric offset sort for case-insensitive ordering", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await store.paginate(WatcherTypeEnum.LOG, {
      perPage: 5,
      sort: "level",
      dir: "asc",
    });

    const [sql] = pool.query.mock.calls[0]!;
    expect(sql).toContain(
      "ORDER BY LOWER((minimal_data ->> 'level')) ASC, seq DESC LIMIT $2 OFFSET $3",
    );
  });

  it("orders by seq ASC (offset) for time-ascending sort", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      sort: "time",
      dir: "asc",
    });

    expect(pool.query.mock.calls[0]![0]).toContain(
      "ORDER BY seq ASC LIMIT $2 OFFSET $3",
    );
  });

  it("counts entries of a type (coercing a string count)", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ count: "7" }] });

    const result = await store.count(WatcherTypeEnum.REQUEST);

    expect(pool.query.mock.calls[0]![0]).toBe(
      "SELECT COUNT(*) AS count FROM lens_entries WHERE type = $1",
    );
    expect(result).toBe(7);
  });

  it("finds an entry by id and type", async () => {
    pool.query.mockResolvedValueOnce({ rows: [row({ id: "abc" })] });

    const result = await store.find(WatcherTypeEnum.REQUEST, "abc");

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain("WHERE id = $1 AND type = $2 LIMIT 1");
    expect(params).toEqual(["abc", WatcherTypeEnum.REQUEST]);
    expect(result).toEqual(expect.objectContaining({ id: "abc" }));
  });

  it("lists correlated entries by request id", async () => {
    pool.query.mockResolvedValueOnce({ rows: [row()] });

    await store.allByRequestId("req-1", WatcherTypeEnum.QUERY);

    const [sql, params] = pool.query.mock.calls[0]!;
    expect(sql).toContain(
      "WHERE type = $1 AND lens_entry_id = $2 ORDER BY created_at DESC",
    );
    expect(params).toEqual([WatcherTypeEnum.QUERY, "req-1"]);
  });

  it("prunes the oldest entries by seq when over the size cap", async () => {
    const s = new SqlStore({
      dialect: "postgres",
      pool,
      dbMaxSizeGb: 1,
      dbPruneSizeGb: 0.5,
    });
    (s as any).pool = pool;

    const sizes = [2 * 1024 ** 3, 0.4 * 1024 ** 3];
    pool.query.mockImplementation(async (sql: string) => {
      if (/pg_total_relation_size/.test(sql)) return { rows: [{ bytes: sizes.shift() }] };
      if (/SELECT seq FROM/.test(sql)) return { rows: [{ seq: 1 }, { seq: 2 }] };
      return { rows: [] };
    });

    await (s as any).maybePruneDatabase();

    const deleteCall = pool.query.mock.calls.find((c) =>
      /DELETE FROM lens_entries WHERE seq IN/.test(c[0] as string),
    );
    expect(deleteCall).toBeTruthy();
    expect(deleteCall![0]).toContain("WHERE seq IN ($1, $2)");
    expect(deleteCall![1]).toEqual([1, 2]);
  });
});

describe("SqlStore (mysql dialect)", () => {
  let store: SqlStore;
  let pool: ReturnType<typeof makeMysqlPool>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    pool = makeMysqlPool();
    store = new SqlStore({ dialect: "mysql", pool });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await store.initialize();
    pool.execute.mockClear();
  });

  it("creates the schema on initialize", async () => {
    const fresh = makeMysqlPool();
    const s = new SqlStore({ dialect: "mysql", pool: fresh });
    await s.initialize();

    const sql = fresh.execute.mock.calls[0]![0] as string;
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS lens_entries");
    expect(sql).toContain("seq BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY");
  });

  it("upserts with DELETE then INSERT and emits insertId as the seq", async () => {
    const emitSpy = vi.spyOn(lensStream, "emit").mockImplementation(() => {});
    pool.execute
      .mockResolvedValueOnce([[]]) // DELETE
      .mockResolvedValueOnce([{ insertId: 456 }]); // INSERT

    await store.save({
      id: "job-1",
      data: { full: true },
      minimal_data: { status: "completed" },
      type: WatcherTypeEnum.JOB,
    });

    expect(pool.execute.mock.calls[0]![0]).toBe(
      "DELETE FROM lens_entries WHERE id = ?",
    );
    expect(pool.execute.mock.calls[1]![0]).toContain(
      "INSERT INTO lens_entries (id, data, type, created_at, lens_entry_id, minimal_data) VALUES (?, ?, ?, ?, ?, ?)",
    );
    expect(pool.execute.mock.calls[1]![0]).not.toContain("RETURNING");
    expect(emitSpy).toHaveBeenCalledWith(
      "entry",
      expect.objectContaining({ cursor: 456 }),
    );
  });

  it("pages older rows with `cursor` (seq <)", async () => {
    pool.execute.mockResolvedValueOnce([[row({ __cursor: 9, seq: 9 })]]);

    await store.paginate(WatcherTypeEnum.REQUEST, { cursor: 20, perPage: 5 });

    const [sql, params] = pool.execute.mock.calls[0]!;
    expect(sql).toContain(
      "WHERE type = ? AND seq < ? ORDER BY seq DESC LIMIT ?",
    );
    expect(params).toEqual([WatcherTypeEnum.REQUEST, 20, 6]);
  });

  it("applies eq / range / search filters with MySQL JSON functions", async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      filters: [
        { field: "method", op: "eq", value: "GET" },
        { field: "status", op: "gte", value: "200" },
      ],
      q: "users",
    });

    const [sql, params] = pool.execute.mock.calls[0]!;
    expect(sql).toContain("JSON_UNQUOTE(JSON_EXTRACT(minimal_data, '$.method')) = ?");
    expect(sql).toContain(
      "CAST(JSON_UNQUOTE(JSON_EXTRACT(minimal_data, '$.status')) AS DECIMAL(30,6)) >= ?",
    );
    expect(sql).toContain("CAST(minimal_data AS CHAR) LIKE ?");
    expect(params).toEqual([WatcherTypeEnum.REQUEST, "GET", 200, "%users%", 6]);
  });

  it("orders a numeric offset sort with a DECIMAL cast", async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await store.paginate(WatcherTypeEnum.REQUEST, {
      perPage: 5,
      sort: "duration",
      dir: "desc",
      numericSort: true,
    });

    expect(pool.execute.mock.calls[0]![0]).toContain(
      "ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(minimal_data, '$.duration')) AS DECIMAL(30,6)) DESC, seq DESC LIMIT ? OFFSET ?",
    );
  });

  it("counts entries of a type", async () => {
    pool.execute.mockResolvedValueOnce([[{ count: 3 }]]);

    const result = await store.count(WatcherTypeEnum.REQUEST);

    expect(pool.execute.mock.calls[0]![0]).toBe(
      "SELECT COUNT(*) AS count FROM lens_entries WHERE type = ?",
    );
    expect(result).toBe(3);
  });

  it("reads the table size from information_schema when pruning", async () => {
    const s = new SqlStore({
      dialect: "mysql",
      pool,
      dbMaxSizeGb: 1,
      dbPruneSizeGb: 0.5,
    });
    (s as any).pool = pool;

    const sizes = [2 * 1024 ** 3, 0.4 * 1024 ** 3];
    pool.execute.mockImplementation(async (sql: string) => {
      if (/information_schema/.test(sql)) return [[{ bytes: sizes.shift() }]];
      if (/SELECT seq FROM/.test(sql)) return [[{ seq: 1 }]];
      return [[]];
    });

    await (s as any).maybePruneDatabase();

    const sizeCall = pool.execute.mock.calls.find((c) =>
      /information_schema/.test(c[0] as string),
    );
    expect(sizeCall).toBeTruthy();
    const deleteCall = pool.execute.mock.calls.find((c) =>
      /DELETE FROM lens_entries WHERE seq IN/.test(c[0] as string),
    );
    expect(deleteCall![1]).toEqual([1]);
  });
});

describe("SqlStore dialect JSON parsing", () => {
  it("passes through objects and parses JSON strings", () => {
    for (const dialect of [createPostgresDialect(), createMysqlDialect()]) {
      expect(dialect.parseJson({ a: 1 })).toEqual({ a: 1 });
      expect(dialect.parseJson('{"a":1}')).toEqual({ a: 1 });
      expect(dialect.parseJson(null)).toBeNull();
    }
  });

  it("mapRow selects full vs minimal payloads", () => {
    const store = new SqlStore({ dialect: "postgres", pool: makePgPool() });
    const r = {
      id: "x",
      data: { full: 1 },
      minimal_data: { min: 1 },
      type: WatcherTypeEnum.REQUEST,
      created_at: "now",
      lens_entry_id: null,
    };
    expect((store as any).mapRow(r, true).data).toEqual({ full: 1 });
    expect((store as any).mapRow(r, false).data).toEqual({ min: 1 });
  });
});

// Optional live integration test — only runs against a real database when
// LENS_TEST_DATABASE_URL is set (e.g. postgres://… or mysql://…). Exercises the
// per-dialect SQL end-to-end: upsert, cursor pagination, filtering, sorting,
// correlation, and count.
describe.skipIf(!process.env.LENS_TEST_DATABASE_URL)("SqlStore (live)", () => {
  // Guarded with `?? ""`: the describe body is still collected when skipped, so
  // this must not throw when the env var is unset.
  const url = process.env.LENS_TEST_DATABASE_URL ?? "";
  const dialect = url.startsWith("mysql") ? "mysql" : "postgres";
  let store: SqlStore;

  beforeEach(async () => {
    vi.restoreAllMocks();
    store = new SqlStore({
      dialect,
      connectionString: url,
      tableName: "lens_entries_test",
    });
    await store.initialize();
    await store.truncate();
  });

  it("persists and reads back full data", async () => {
    await store.save({
      id: "live-1",
      data: { hello: "world" },
      minimal_data: { method: "GET", status: "200", duration: "5 ms" },
      type: WatcherTypeEnum.REQUEST,
      requestId: "req-1",
    });

    const found = await store.find(WatcherTypeEnum.REQUEST, "live-1");
    expect(found?.data).toEqual({ hello: "world" });

    const byReq = await store.allByRequestId("req-1", WatcherTypeEnum.REQUEST);
    expect(byReq).toHaveLength(1);
    expect(await store.count(WatcherTypeEnum.REQUEST)).toBe(1);
  });

  it("upserts a job in place across status changes (one row, fresh cursor)", async () => {
    await store.save({
      id: "job-1",
      data: { name: "email" },
      minimal_data: { status: "active" },
      type: WatcherTypeEnum.JOB,
    });
    await store.save({
      id: "job-1",
      data: { name: "email" },
      minimal_data: { status: "completed" },
      type: WatcherTypeEnum.JOB,
    });

    expect(await store.count(WatcherTypeEnum.JOB)).toBe(1);
    const page = await store.paginate(WatcherTypeEnum.JOB, { perPage: 10 }, false);
    expect(page.data).toHaveLength(1);
    expect((page.data[0] as any).data.status).toBe("completed");
  });

  it("filters and sorts server-side", async () => {
    for (const [i, method] of ["GET", "POST", "GET"].entries()) {
      await store.save({
        id: `r-${i}`,
        data: { i },
        minimal_data: { method, status: "200", duration: `${(i + 1) * 10} ms` },
        type: WatcherTypeEnum.REQUEST,
      });
    }

    const filtered = await store.paginate<any[]>(
      WatcherTypeEnum.REQUEST,
      { perPage: 10, filters: [{ field: "method", op: "eq", value: "GET" }] },
      false,
    );
    expect(filtered.data).toHaveLength(2);

    const sorted = await store.paginate<any[]>(
      WatcherTypeEnum.REQUEST,
      { perPage: 10, sort: "duration", dir: "desc", numericSort: true },
      false,
    );
    expect(sorted.data.map((r) => r.data.duration)).toEqual([
      "30 ms",
      "20 ms",
      "10 ms",
    ]);
  });
});
