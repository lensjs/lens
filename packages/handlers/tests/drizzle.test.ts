import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  createDrizzleHandler,
  createLensDrizzleLogger,
} from "../src/query/drizzle";
import { watcherEmitter } from "../src/utils/emitter";
import { lensUtils } from "@lensjs/core";

vi.mock("../src/utils/emitter", () => ({
  watcherEmitter: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("@lensjs/core", () => ({
  lensUtils: {
    interpolateQuery: vi.fn(
      (sql, params) => `interpolated(${sql}, ${JSON.stringify(params)})`,
    ),
    formatSqlQuery: vi.fn((sql, provider) => `formatted(${sql}, ${provider})`),
  },
  getCurrentRequestId: vi.fn(() => "test-request-id"),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-09-18T12:00:00.000Z"),
}));

describe("createLensDrizzleLogger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emits drizzleQuery in-context on logQuery", () => {
    const logger = createLensDrizzleLogger();
    logger.logQuery("SELECT 1", [1]);

    expect(watcherEmitter.emit).toHaveBeenCalledWith("drizzleQuery", {
      query: "SELECT 1",
      params: [1],
      requestId: "test-request-id",
    });
  });

  it("defaults params to an empty array", () => {
    const logger = createLensDrizzleLogger();
    logger.logQuery("SELECT 1", undefined as unknown as unknown[]);

    expect(watcherEmitter.emit).toHaveBeenCalledWith(
      "drizzleQuery",
      expect.objectContaining({ params: [] }),
    );
  });
});

describe("createDrizzleHandler", () => {
  let onQueryMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    onQueryMock = vi.fn();
  });

  it("registers a listener on watcherEmitter for drizzleQuery", async () => {
    const handler = createDrizzleHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    expect(watcherEmitter.on).toHaveBeenCalledWith(
      "drizzleQuery",
      expect.any(Function),
    );
  });

  it("calls onQuery with formatted data and a 0 ms duration", async () => {
    const handler = createDrizzleHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
    await listener({ query: "SELECT * FROM users WHERE id = ?", params: [1] });

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE id = ?",
      [1],
    );
    expect(onQueryMock).toHaveBeenCalledWith(
      {
        query:
          "formatted(interpolated(SELECT * FROM users WHERE id = ?, [1]), postgresql)",
        duration: "0 ms",
        createdAt: "2025-09-18T12:00:00.000Z",
        type: "postgresql",
      },
      "test-request-id",
    );
  });

  it.each(["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT"])(
    "ignores %s transaction queries",
    async (ignoredQuery) => {
      const handler = createDrizzleHandler({ provider: "sqlite" });
      await handler({ onQuery: onQueryMock });

      const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
      await listener({ query: ignoredQuery, params: [] });

      expect(onQueryMock).not.toHaveBeenCalled();
    },
  );

  it("defaults missing params to an empty array", async () => {
    const handler = createDrizzleHandler({ provider: "mysql" });
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
    await listener({ query: "SELECT 1" });

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith("SELECT 1", []);
    expect(onQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mysql" }),
      "test-request-id",
    );
  });

  it("supports the mysql/postgresql/sqlite providers", async () => {
    for (const provider of ["mysql", "postgresql", "sqlite"] as const) {
      vi.clearAllMocks();
      onQueryMock = vi.fn();
      const handler = createDrizzleHandler({ provider });
      await handler({ onQuery: onQueryMock });

      const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
      await listener({ query: "SELECT 1", params: [] });

      expect(onQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: provider }),
        "test-request-id",
      );
    }
  });
});
