// sequelizeHandler.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { createSequelizeHandler, normalizeSql, normalizeQuery, sequelizeEventHandler } from "../src/query/sequelize";
import { watcherEmitter } from "../src/utils/emitter";
import { lensUtils } from "@lensjs/core";
import { now } from "@lensjs/date";

// Mock dependencies
vi.mock("../src/utils/emitter", () => ({
  watcherEmitter: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("@lensjs/core", () => ({
  lensUtils: {
    interpolateQuery: vi.fn((sql, params) => `${sql} -- ${JSON.stringify(params)}`),
    formatSqlQuery: vi.fn((sql, provider) => `formatted(${sql}, ${provider})`),
  },
}));

vi.mock("@lensjs/date", () => ({
  now: vi.fn(() => "2025-09-18T12:00:00.000Z"),
}));

// ------------------------------
// Unit tests for normalizeSql
// ------------------------------
describe("normalizeSql", () => {
  it("removes 'Executed (default): ' prefix", () => {
    expect(normalizeSql("Executed (default): SELECT * FROM users")).toBe("SELECT * FROM users");
  });

  it("returns unchanged SQL if no prefix", () => {
    expect(normalizeSql("SELECT * FROM users")).toBe("SELECT * FROM users");
  });
});

// ------------------------------
// Unit tests for normalizeQuery
// ------------------------------
describe("normalizeQuery", () => {
  it("returns SQL with empty params when no params provided", () => {
    const result = normalizeQuery("SELECT * FROM users;");
    expect(result).toEqual({ sql: "SELECT * FROM users", params: [] });
  });

  it("parses object-style params", () => {
    const result = normalizeQuery('SELECT * FROM users WHERE id = $1;{"$1":1}');
    expect(result).toEqual({ sql: "SELECT * FROM users WHERE id = $1", params: { $1: 1 } });
  });

  it("parses array-style params split by commas", () => {
    const result = normalizeQuery('SELECT * FROM users WHERE id = $1;1,"Alice"');
    expect(result).toEqual({ sql: "SELECT * FROM users WHERE id = $1", params: [1, "Alice"] });
  });

  it("throws error if params are invalid JSON", () => {
    expect(() => normalizeQuery("SELECT * FROM users;invalidJson")).toThrow("Failed to extract params from query");
  });
});

// ------------------------------
// Unit tests for sequelizeEventHandler
// ------------------------------
describe("sequelizeEventHandler", () => {
  it("formats query and metadata correctly (object params)", () => {
    const result = sequelizeEventHandler({
      payload: {
        sql: 'SELECT * FROM users WHERE id = $1;{"$1":1}',
        timing: 12.345,
      },
      provider: "postgres",
    });

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1", { $1: 1 });
    expect(lensUtils.formatSqlQuery).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1 -- {"$1":1}',
      "postgres"
    );
    expect(result).toEqual({
      query: 'formatted(SELECT * FROM users WHERE id = $1 -- {"$1":1}, postgres)',
      duration: "12.3 ms",
      type: "postgres",
      createdAt: "2025-09-18T12:00:00.000Z",
    });
  });

  it("throws if sql is not a string", () => {
    expect(() =>
      sequelizeEventHandler({ payload: { sql: 123 as any, timing: 1 }, provider: "mysql" })
    ).toThrow("payload.sql must be a string");
  });

  it("throws if timing is not a number", () => {
    expect(() =>
      sequelizeEventHandler({ payload: { sql: "SELECT 1", timing: "bad" as any }, provider: "mysql" })
    ).toThrow("payload.timing must be a number");
  });
});

// ------------------------------
// Integration tests for createSequelizeHandler
// ------------------------------
describe("createSequelizeHandler", () => {
  let onQueryMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    onQueryMock = vi.fn();
  });

  it("should register a sequelizeQuery listener with watcherEmitter", async () => {
    const handler = createSequelizeHandler({ provider: "sqlite" });
    await handler({ onQuery: onQueryMock });
    expect(watcherEmitter.on).toHaveBeenCalledTimes(1);
    expect(watcherEmitter.on).toHaveBeenCalledWith("sequelizeQuery", expect.any(Function));
  });

  it("should call onQuery with formatted data for a successful query", async () => {
    const handler = createSequelizeHandler({ provider: "mysql" });
    await handler({ onQuery: onQueryMock });

    const sequelizeEvent = {
      sql: "Executed (default): SELECT * FROM users WHERE id = 1; 1",
      timing: 15.2,
    };

    const listener = (watcherEmitter.on as Mock).mock.calls[0][1];
    listener(sequelizeEvent);

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith("SELECT * FROM users WHERE id = 1", [1]);
    expect(lensUtils.formatSqlQuery).toHaveBeenCalledWith("SELECT * FROM users WHERE id = 1 -- [1]", "mysql");
    expect(onQueryMock).toHaveBeenCalledWith({
      query: "formatted(SELECT * FROM users WHERE id = 1 -- [1], mysql)",
      duration: "15.2 ms",
      type: "mysql",
      createdAt: "2025-09-18T12:00:00.000Z",
    });
  });

  it("should handle queries without parameters", async () => {
    const handler = createSequelizeHandler({ provider: "postgresql" });
    await handler({ onQuery: onQueryMock });

    const sequelizeEvent = {
      sql: "Executed (default): SELECT COUNT(*) FROM posts;",
      timing: 5.0,
    };

    const listener = (watcherEmitter.on as Mock).mock.calls[0][1];
    listener(sequelizeEvent);

    expect(lensUtils.interpolateQuery).toHaveBeenCalledWith("SELECT COUNT(*) FROM posts", []);
    expect(onQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "formatted(SELECT COUNT(*) FROM posts -- [], postgresql)",
        duration: "5.0 ms",
        type: "postgresql",
      })
    );
  });

  it("should throw error if payload.sql is not a string", async () => {
    const handler = createSequelizeHandler({ provider: "sqlite" });
    await handler({ onQuery: onQueryMock });

    const sequelizeEvent = {
      sql: 123,
      timing: 10,
    };

    const listener = (watcherEmitter.on as Mock).mock.calls[0][1];
    expect(() => listener(sequelizeEvent)).toThrow("payload.sql must be a string");
    expect(onQueryMock).not.toHaveBeenCalled();
  });

  it("should throw error if payload.timing is not a number", async () => {
    const handler = createSequelizeHandler({ provider: "sqlite" });
    await handler({ onQuery: onQueryMock });

    const sequelizeEvent = {
      sql: "SELECT 1",
      timing: "abc",
    };

    const listener = (watcherEmitter.on as Mock).mock.calls[0][1];
    expect(() => listener(sequelizeEvent)).toThrow("payload.timing must be a number");
    expect(onQueryMock).not.toHaveBeenCalled();
  });

  it("should throw error for malformed parameter string", async () => {
    const handler = createSequelizeHandler({ provider: "sqlite" });
    await handler({ onQuery: onQueryMock });

    const sequelizeEvent = {
      sql: "Executed (default): SELECT * FROM users;{invalid json",
      timing: 10,
    };

    const listener = (watcherEmitter.on as Mock).mock.calls[0][1];
    expect(() => listener(sequelizeEvent)).toThrow("Failed to extract params from query");
    expect(onQueryMock).not.toHaveBeenCalled();
  });
});
