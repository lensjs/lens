import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import BetterSqliteStore from "../../src/stores/better_sqlite";
import { WatcherTypeEnum, PaginationParams } from "../../src/types";
import Database from "libsql";

// Mock the libsql, @lensjs/date, and crypto modules
vi.mock("libsql", () => {
  const mockRun = vi.fn();
  const mockAll = vi.fn(() => []);
  const mockGet = vi.fn(() => undefined);
  const mockPrepare = vi.fn(() => ({
    run: mockRun,
    all: mockAll,
    get: mockGet,
  }));
  const mockConnection = {
    prepare: mockPrepare,
    exec: vi.fn(),
  };
  return {
    default: vi.fn(() => mockConnection),
  };
});

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-01-01T00:00:00.000Z"),
  sqlDateTime: vi.fn(() => "2025-01-01 00:00:00"),
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "mock-uuid"),
}));

describe("BetterSqliteStore", () => {
  let store: BetterSqliteStore;
  let mockConnection: any;

  beforeEach(() => {
    store = new BetterSqliteStore();
    mockConnection = new Database("lens.db");
    (store as any).connection = mockConnection; // Inject the mock connection
    vi.clearAllMocks();
  });

  describe("initialize", () => {
    it("should initialize the database connection and setup schema", async () => {
      const setupSchemaSpy = vi.spyOn(store as any, "setupSchema");
      await store.initialize();
      expect(Database).toHaveBeenCalledWith("lens.db");
      expect(setupSchemaSpy).toHaveBeenCalled();
    });
  });

  describe("truncate", () => {
    it("should delete all entries from the table", async () => {
      const runSpy = vi.fn();
      (mockConnection.prepare as Mock).mockReturnValueOnce({ run: runSpy });

      await store.truncate();
      expect(mockConnection.prepare).toHaveBeenCalledWith(
        "DELETE FROM lens_entries;",
      );
      expect(runSpy).toHaveBeenCalled();
    });
  });

  describe("save", () => {
    it("should save a new entry with generated ID and timestamp", async () => {
      const runSpy = vi.fn();
      (mockConnection.prepare as Mock).mockReturnValueOnce({ run: runSpy });

      const entry = {
        data: { foo: "bar" },
        type: WatcherTypeEnum.REQUEST,
      };
      await store.save(entry);

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO lens_entries"),
      );
      expect(runSpy).toHaveBeenCalledWith({
        id: "mock-uuid",
        data: '{"foo":"bar"}',
        type: WatcherTypeEnum.REQUEST,
        created_at: "2025-01-01T00:00:00.000Z",
        lens_entry_id: null,
        minimalData: "{}",
      });
    });

    it("should save an entry with provided ID, timestamp, and requestId", async () => {
      const runSpy = vi.fn();
      (mockConnection.prepare as Mock).mockReturnValueOnce({ run: runSpy });

      const entry = {
        id: "custom-id",
        data: { baz: "qux" },
        minimal_data: { min: "data" },
        type: WatcherTypeEnum.QUERY,
        timestamp: "2024-01-01T10:00:00.000Z",
        requestId: "req-123",
      };
      await store.save(entry);

      expect(runSpy).toHaveBeenCalledWith({
        id: "custom-id",
        data: '{"baz":"qux"}',
        type: WatcherTypeEnum.QUERY,
        created_at: "2024-01-01T10:00:00.000Z",
        lens_entry_id: "req-123",
        minimalData: '{"min":"data"}',
      });
    });

    it("should stringify data if it is an object", async () => {
      const runSpy = vi.fn();
      (mockConnection.prepare as Mock).mockReturnValueOnce({ run: runSpy });

      const entry = {
        data: { key: "value" },
        type: WatcherTypeEnum.CACHE,
      };
      await store.save(entry);
      expect(runSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: '{"key":"value"}',
        }),
      );
    });

    it("should not stringify data if it is already a string", async () => {
      const runSpy = vi.fn();
      (mockConnection.prepare as Mock).mockReturnValueOnce({ run: runSpy });

      const entry = {
        data: "some string data",
        type: WatcherTypeEnum.CACHE,
      };
      await store.save(entry);
      expect(runSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: "some string data",
        }),
      );
    });
  });

  describe("getAllQueries", () => {
    it("should call paginate with correct parameters for queries", async () => {
      const paginateSpy = vi
        .spyOn(store, "paginate")
        .mockResolvedValue({} as any);
      const pagination: PaginationParams = { page: 1, perPage: 10 };
      await store.getAllQueries(pagination);
      expect(paginateSpy).toHaveBeenCalledWith(
        WatcherTypeEnum.QUERY,
        pagination,
      );
    });
  });

  describe("getAllRequests", () => {
    it("should call paginate with correct parameters for requests", async () => {
      const paginateSpy = vi
        .spyOn(store, "paginate")
        .mockResolvedValue({} as any);
      const pagination: PaginationParams = { page: 1, perPage: 10 };
      await store.getAllRequests(pagination);
      expect(paginateSpy).toHaveBeenCalledWith(
        WatcherTypeEnum.REQUEST,
        pagination,
        false,
      );
    });
  });

  describe("getAllCacheEntries", () => {
    it("should call paginate with correct parameters for cache entries", async () => {
      const paginateSpy = vi
        .spyOn(store, "paginate")
        .mockResolvedValue({} as any);
      const pagination: PaginationParams = { page: 1, perPage: 10 };
      await store.getAllCacheEntries(pagination);
      expect(paginateSpy).toHaveBeenCalledWith(
        WatcherTypeEnum.CACHE,
        pagination,
      );
    });
  });

  describe("allByRequestId", () => {
    it("should return all entries for a given requestId and type", async () => {
      const mockRows = [
        {
          id: "entry1",
          data: '{"key":"val1"}',
          minimal_data: '{"key":"val1"}',
          type: WatcherTypeEnum.QUERY,
          created_at: "now",
          lens_entry_id: "req1",
        },
        {
          id: "entry2",
          data: '{"key":"val2"}',
          minimal_data: '{"key":"val2"}',
          type: WatcherTypeEnum.QUERY,
          created_at: "now",
          lens_entry_id: "req1",
        },
      ];
      const allSpy = vi.fn(() => mockRows);
      (mockConnection.prepare as Mock).mockReturnValueOnce({ all: allSpy });

      const result = await store.allByRequestId("req1", WatcherTypeEnum.QUERY);

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        expect.stringContaining(
          "FROM lens_entries WHERE type = $type AND lens_entry_id = $requestId ORDER BY created_at DESC",
        ),
      );
      expect(allSpy).toHaveBeenCalledWith({
        type: WatcherTypeEnum.QUERY,
        requestId: "req1",
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("entry1");
    });
  });

  describe("paginate", () => {
    it("should return paginated data with meta information", async () => {
      const mockRows = [
        {
          id: "entry1",
          data: '{"key":"val1"}',
          minimal_data: '{"key":"val1"}',
          type: WatcherTypeEnum.REQUEST,
          created_at: "now",
          lens_entry_id: null,
        },
      ];
      const allSpy = vi.fn(() => mockRows);
      const prepareSpy = vi.fn(() => ({ all: allSpy }));
      (mockConnection.prepare as Mock).mockImplementation((sql: string) => {
        if (sql.includes("SELECT count(*)")) {
          return { get: vi.fn(() => ({ count: 10 })) };
        }
        return { all: allSpy };
      });

      const pagination: PaginationParams = { page: 2, perPage: 5 };
      const result = await store.paginate(WatcherTypeEnum.REQUEST, pagination);

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        expect.stringContaining(
          "FROM lens_entries WHERE type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        ),
      );
      expect(allSpy).toHaveBeenCalledWith(WatcherTypeEnum.REQUEST, 5, 5);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 10,
        lastPage: 2,
        currentPage: 2,
      });
    });

    it("should not include full data if includeFullData is false", async () => {
      const mockRows = [
        {
          id: "entry1",
          data: '{"key":"val1"}',
          minimal_data: '{"min":"data"}',
          type: WatcherTypeEnum.REQUEST,
          created_at: "now",
          lens_entry_id: null,
        },
      ];
      const allSpy = vi.fn(() => mockRows);
      const prepareSpy = vi.fn(() => ({ all: allSpy }));
      (mockConnection.prepare as Mock).mockImplementation((sql: string) => {
        if (sql.includes("SELECT count(*)")) {
          return { get: vi.fn(() => ({ count: 1 })) };
        }
        return { all: allSpy };
      });

      const pagination: PaginationParams = { page: 1, perPage: 10 };
      const result = await store.paginate(
        WatcherTypeEnum.REQUEST,
        pagination,
        false,
      );

      expect(result.data[0].data).toEqual({ min: "data" });
    });
  });

  describe("count", () => {
    it("should return the count of entries for a given type", async () => {
      const getSpy = vi.fn(() => ({ count: 5 }));
      (mockConnection.prepare as Mock).mockReturnValueOnce({ get: getSpy });

      const result = await store.count(WatcherTypeEnum.REQUEST);
      expect(mockConnection.prepare).toHaveBeenCalledWith(
        "SELECT count(*) as count FROM lens_entries WHERE type = ?",
      );
      expect(getSpy).toHaveBeenCalledWith(WatcherTypeEnum.REQUEST);
      expect(result).toBe(5);
    });
  });

  describe("find", () => {
    it("should return an entry if found", async () => {
      const mockRow = {
        id: "entry1",
        data: '{"key":"val1"}',
        minimal_data: '{"key":"val1"}',
        type: WatcherTypeEnum.REQUEST,
        created_at: "now",
        lens_entry_id: null,
      };
      const getSpy = vi.fn(() => mockRow);
      (mockConnection.prepare as Mock).mockReturnValueOnce({ get: getSpy });

      const result = await store.find(WatcherTypeEnum.REQUEST, "entry1");

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        expect.stringContaining(
          "FROM lens_entries WHERE id = ? AND type = ? LIMIT 1",
        ),
      );
      expect(getSpy).toHaveBeenCalledWith("entry1", WatcherTypeEnum.REQUEST);
      expect(result).toEqual(expect.objectContaining({ id: "entry1" }));
    });

    it("should return null if entry not found", async () => {
      const getSpy = vi.fn(() => undefined);
      (mockConnection.prepare as Mock).mockImplementation((sql: string) => {
        if (sql.includes("SELECT count(*)")) {
          return { get: vi.fn(() => ({ count: 0 })) };
        } else if (
          sql.includes("FROM lens_entries WHERE id = ? AND type = ? LIMIT 1")
        ) {
          return { get: getSpy };
        }
        return { all: vi.fn(() => []) };
      });

      const result = await store.find(WatcherTypeEnum.REQUEST, "nonexistent");

      expect(getSpy).toHaveBeenCalledWith(
        "nonexistent",
        WatcherTypeEnum.REQUEST,
      );
      expect(result).toBeNull();
    });
  });

  describe("setupSchema", () => {
    it("should execute create table and index statements", () => {
      (store as any).setupSchema();
      expect(mockConnection.exec).toHaveBeenCalledTimes(5);
      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining("PRAGMA journal_mode = WAL;"),
      );
      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining("PRAGMA synchronous = NORMAL;"),
      );
      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS lens_entries"),
      );
      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          "CREATE INDEX IF NOT EXISTS lens_entries_id_type_index",
        ),
      );
      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          "CREATE INDEX IF NOT EXISTS lens_entry_id_index",
        ),
      );
    });
  });

  describe("mapRow", () => {
    it("should map a row with full data", () => {
      const row = {
        id: "test",
        data: '{"foo":"bar"}',
        minimal_data: '{"min":"data"}',
        type: WatcherTypeEnum.REQUEST,
        created_at: "now",
        lens_entry_id: null,
      };
      const result = (store as any).mapRow(row, true);
      expect(result.data).toEqual({ foo: "bar" });
    });

    it("should map a row with minimal data", () => {
      const row = {
        id: "test",
        data: '{"foo":"bar"}',
        minimal_data: '{"min":"data"}',
        type: WatcherTypeEnum.REQUEST,
        created_at: "now",
        lens_entry_id: null,
      };
      const result = (store as any).mapRow(row, false);
      expect(result.data).toEqual({ min: "data" });
    });
  });

  describe("mapRows", () => {
    it("should map multiple rows", () => {
      const rows = [
        {
          id: "test1",
          data: '{"foo":"bar1"}',
          minimal_data: '{"min":"data1"}',
          type: WatcherTypeEnum.REQUEST,
          created_at: "now",
          lens_entry_id: null,
        },
        {
          id: "test2",
          data: '{"foo":"bar2"}',
          minimal_data: '{"min":"data2"}',
          type: WatcherTypeEnum.REQUEST,
          created_at: "now",
          lens_entry_id: null,
        },
      ];
      const result = (store as any).mapRows(rows);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("test1");
    });
  });

  describe("getSelectedColumns", () => {
    it("should return columns with data when includeFullData is true", () => {
      const result = (store as any).getSelectedColumns(true);
      expect(result).toBe(
        "SELECT id, minimal_data, type, created_at, lens_entry_id ,data",
      );
    });

    it("should return columns without data when includeFullData is false", () => {
      const result = (store as any).getSelectedColumns(false);
      expect(result).toBe(
        "SELECT id, minimal_data, type, created_at, lens_entry_id ",
      );
    });
  });
});
