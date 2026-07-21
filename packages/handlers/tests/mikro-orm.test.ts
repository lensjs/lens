import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { createMikroOrmHandler } from "../src/query/mikro-orm";
import { watcherEmitter } from "../src/utils/emitter";
import { lensUtils } from "@lensjs/core";

// Mock dependencies — factories must be inline (no top-level vars) due to vi.mock hoisting
vi.mock("../src/utils/emitter", () => ({
  watcherEmitter: {
    on: vi.fn(),
  },
}));

vi.mock("@lensjs/core", () => ({
  lensUtils: {
    interpolateQuery: vi.fn(
      (sql, params) => `interpolated(${sql}, ${JSON.stringify(params)})`,
    ),
    formatSqlQuery: vi.fn(
      (sql, provider) => `formatted(${sql}, ${provider})`,
    ),
  },
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-09-18T12:00:00.000Z"),
}));

describe("createMikroOrmHandler", () => {
  let onQueryMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    onQueryMock = vi.fn();
  });

  it("should register a listener on watcherEmitter for mikroOrmQuery", async () => {
    const handler = createMikroOrmHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    expect(watcherEmitter.on).toHaveBeenCalledTimes(1);
    expect(watcherEmitter.on).toHaveBeenCalledWith(
      "mikroOrmQuery",
      expect.any(Function),
    );
  });

  it("should call onQuery with formatted data for a valid query", async () => {
    const handler = createMikroOrmHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    // Grab the registered listener
    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

    const mikroOrmPayload = {
      query: 'SELECT * FROM "users" WHERE "id" = ?',
      params: [1],
      took: 10.5,
    };

    await listener(mikroOrmPayload);

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith(
      mikroOrmPayload.query,
      [1],
    );
    expect(lensUtils.formatSqlQuery).toHaveBeenCalledWith(
      `interpolated(${mikroOrmPayload.query}, [1])`,
      "postgresql",
    );
    expect(onQueryMock).toHaveBeenCalledTimes(1);
    expect(onQueryMock).toHaveBeenCalledWith({
      query: `formatted(interpolated(SELECT * FROM "users" WHERE "id" = ?, [1]), postgresql)`,
      duration: "10.5 ms",
      createdAt: "2025-09-18T12:00:00.000Z",
      type: "postgresql",
    });
  });

  it("should handle undefined took as '0.0 ms'", async () => {
    const handler = createMikroOrmHandler({ provider: "sqlite" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

    await listener({
      query: "SELECT 1",
      params: [],
    });

    expect(onQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: "0.0 ms",
      }),
    );
  });

  it("should handle undefined params as empty array", async () => {
    const handler = createMikroOrmHandler({ provider: "mysql" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

    await listener({
      query: "SELECT 1",
      took: 2.0,
    });

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith("SELECT 1", []);
    expect(onQueryMock).toHaveBeenCalledTimes(1);
  });

  it.each(["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT"])(
    "should ignore %s transaction queries",
    async (ignoredQuery) => {
      const handler = createMikroOrmHandler({ provider: "postgresql" });
      await handler({ onQuery: onQueryMock });

      const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

      await listener({
        query: ignoredQuery,
        params: [],
        took: 1.0,
      });

      expect(onQueryMock).not.toHaveBeenCalled();
    },
  );

  it("should ignore parameterized transaction queries like 'SAVEPOINT xyz'", async () => {
    const handler = createMikroOrmHandler({ provider: "mysql" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

    await listener({
      query: "SAVEPOINT sp1",
      params: [],
      took: 0.5,
    });

    expect(onQueryMock).not.toHaveBeenCalled();
  });

  it("should NOT ignore non-transaction queries that merely contain a keyword as substring", async () => {
    const handler = createMikroOrmHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];

    // "SELECT * FROM beginning_table" — contains "BEGIN" as substring
    // but the filter checks for exact match or startsWith "BEGIN ",
    // so this should pass through
    await listener({
      query: "SELECT * FROM beginning_table",
      params: [],
      took: 3.0,
    });

    expect(onQueryMock).toHaveBeenCalledTimes(1);
  });

  it("should support all provider types", async () => {
    const providers = [
      "mysql",
      "postgresql",
      "sqlite",
      "mariadb",
      "tsql",
    ] as const;

    for (const provider of providers) {
      vi.clearAllMocks();
      onQueryMock = vi.fn();
      const handler = createMikroOrmHandler({ provider });
      await handler({ onQuery: onQueryMock });

      const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
      await listener({
        query: "SELECT 1",
        params: [],
        took: 1.0,
      });

      expect(onQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: provider }),
      );
    }
  });
});
