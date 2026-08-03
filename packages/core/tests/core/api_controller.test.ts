import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ApiController } from "../../src/core/api_controller";
import Store from "../../src/abstracts/store";
import { WatcherTypeEnum, Paginator, LensEntry } from "../../src/types";

// Mock implementations for Store
class MockStore extends Store {
  initialize = vi.fn();
  save = vi.fn();
  getAllRequests = vi.fn();
  getAllQueries = vi.fn();
  getAllCacheEntries = vi.fn();
  allByRequestId = vi.fn();
  find = vi.fn();
  truncate = vi.fn();
  paginate = vi.fn();
  count = vi.fn();
}

// Mock the context module to control getStore and getUiConfig
vi.mock("../../src/context/context", () => ({
  getStore: vi.fn(),
  getUiConfig: vi.fn(),
}));

import { getStore, getUiConfig } from "../../src/context/context";

describe("ApiController", () => {
  let mockStore: MockStore;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    (getUiConfig as Mock).mockReturnValue({
      appName: "TestApp",
      path: "/lens",
      enabled: true,
    });
    vi.clearAllMocks();
  });

  describe("getRequests", () => {
    it("should return paginated requests", async () => {
      const mockRequests: Omit<LensEntry, "data">[] = [
        {
          id: "req1",
          type: WatcherTypeEnum.REQUEST,
          created_at: "now",
          lens_entry_id: null,
          data: {},
        },
      ];
      const mockPaginator: Paginator<Omit<LensEntry, "data">[]> = {
        data: mockRequests,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      };
      mockStore.getAllRequests.mockResolvedValue(mockPaginator);

      const result = await ApiController.getRequests({
        qs: { page: "1", perPage: "10" },
      });

      expect(mockStore.getAllRequests).toHaveBeenCalledWith({
        perPage: 10,
      });
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockRequests,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      });
    });

    it("should use default pagination if qs is empty", async () => {
      const mockRequests: Omit<LensEntry, "data">[] = [];
      const mockPaginator: Paginator<Omit<LensEntry, "data">[]> = {
        data: mockRequests,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      };
      mockStore.getAllRequests.mockResolvedValue(mockPaginator);

      await ApiController.getRequests({ qs: {} });

      expect(mockStore.getAllRequests).toHaveBeenCalledWith({
        perPage: 100,
      });
    });
  });

  describe("getRequest", () => {
    it("should return a single request with associated queries and cache entries", async () => {
      const mockRequest: LensEntry = {
        id: "req1",
        type: WatcherTypeEnum.REQUEST,
        created_at: "now",
        lens_entry_id: null,
        data: { method: "GET", path: "/test" },
      };
      const mockQueries: LensEntry[] = [
        {
          id: "query1",
          type: WatcherTypeEnum.QUERY,
          created_at: "now",
          lens_entry_id: "req1",
          data: { sql: "SELECT 1" },
        },
      ];
      const mockCacheEntries: LensEntry[] = [
        {
          id: "cache1",
          type: WatcherTypeEnum.CACHE,
          created_at: "now",
          lens_entry_id: "req1",
          data: { key: "test" },
        },
      ];

      mockStore.find.mockImplementation((type, id) => {
        if (type === WatcherTypeEnum.REQUEST && id === "req1")
          return Promise.resolve(mockRequest);
        return Promise.resolve(null);
      });
      mockStore.allByRequestId.mockImplementation((requestId, type) => {
        if (requestId === "req1" && type === WatcherTypeEnum.QUERY)
          return Promise.resolve(mockQueries);
        if (requestId === "req1" && type === WatcherTypeEnum.CACHE)
          return Promise.resolve(mockCacheEntries);
        if (requestId === "req1" && type === WatcherTypeEnum.EXCEPTION)
          return Promise.resolve([]); // Added for exceptions
        return Promise.resolve([]);
      });

      const result = await ApiController.getRequest({
        params: { id: "req1" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.REQUEST,
        "req1",
      );
      expect(mockStore.allByRequestId).toHaveBeenCalledWith(
        "req1",
        WatcherTypeEnum.QUERY,
      );
      expect(mockStore.allByRequestId).toHaveBeenCalledWith(
        "req1",
        WatcherTypeEnum.CACHE,
      );
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: {
          request: mockRequest,
          queries: mockQueries,
          cacheEntries: mockCacheEntries,
          exceptions: [],
          emails: [],
          httpEntries: [],
          eventEntries: [],
          redisEntries: [],
          fcmEntries: [],
          logEntries: [],
          jobEntries: [],
        },
      });
    });

    it("should return 404 if request not found", async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getRequest({
        params: { id: "nonexistent" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.REQUEST,
        "nonexistent",
      );
      expect(result).toEqual({
        status: 404,
        message: "Could not find the requested resource",
        data: null,
      });
    });
  });

  describe("getQueries", () => {
    it("should return paginated queries", async () => {
      const mockQueries: LensEntry[] = [
        {
          id: "query1",
          type: WatcherTypeEnum.QUERY,
          created_at: "now",
          lens_entry_id: "req1",
          data: { sql: "SELECT 1" },
        },
      ];
      const mockPaginator: Paginator<LensEntry[]> = {
        data: mockQueries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      };
      mockStore.getAllQueries.mockResolvedValue(mockPaginator);

      const result = await ApiController.getQueries({
        qs: { page: "1", perPage: "10" },
      });

      expect(mockStore.getAllQueries).toHaveBeenCalledWith({
        perPage: 10,
      });
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockQueries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      });
    });
  });

  describe("getQuery", () => {
    it("should return a single query", async () => {
      const mockQuery: LensEntry = {
        id: "query1",
        type: WatcherTypeEnum.QUERY,
        created_at: "now",
        lens_entry_id: "req1",
        data: { sql: "SELECT 1" },
      };
      mockStore.find.mockResolvedValue(mockQuery);

      const result = await ApiController.getQuery({
        params: { id: "query1" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.QUERY,
        "query1",
      );
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockQuery,
      });
    });

    it("should return 404 if query not found", async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getQuery({
        params: { id: "nonexistent" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.QUERY,
        "nonexistent",
      );
      expect(result).toEqual({
        status: 404,
        message: "Could not find the requested resource",
        data: null,
      });
    });
  });

  describe("getCacheEntries", () => {
    it("should return paginated cache entries", async () => {
      const mockCacheEntries: Omit<LensEntry, "data">[] = [
        {
          id: "cache1",
          type: WatcherTypeEnum.CACHE,
          created_at: "now",
          lens_entry_id: "req1",
          data: {},
        },
      ];
      const mockPaginator: Paginator<Omit<LensEntry, "data">[]> = {
        data: mockCacheEntries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      };
      mockStore.getAllCacheEntries.mockResolvedValue(mockPaginator);

      const result = await ApiController.getCacheEntries({
        qs: { page: "1", perPage: "10" },
      });

      expect(mockStore.getAllCacheEntries).toHaveBeenCalledWith({
        perPage: 10,
      });
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockCacheEntries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      });
    });
  });

  describe("getCacheEntry", () => {
    it("should return a single cache entry", async () => {
      const mockCacheEntry: LensEntry = {
        id: "cache1",
        type: WatcherTypeEnum.CACHE,
        created_at: "now",
        lens_entry_id: "req1",
        data: { key: "test" },
      };
      mockStore.find.mockResolvedValue(mockCacheEntry);

      const result = await ApiController.getCacheEntry({
        params: { id: "cache1" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.CACHE,
        "cache1",
      );
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockCacheEntry,
      });
    });

    it("should return 404 if cache entry not found", async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getCacheEntry({
        params: { id: "nonexistent" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.CACHE,
        "nonexistent",
      );
      expect(result).toEqual({
        status: 404,
        message: "Could not find the requested resource",
        data: null,
      });
    });
  });

  describe("getLogEntries", () => {
    it("should return paginated log entries (minimal, LOG type)", async () => {
      const mockLogEntries: Omit<LensEntry, "data">[] = [
        {
          id: "log1",
          type: WatcherTypeEnum.LOG,
          created_at: "now",
          lens_entry_id: "req1",
          data: {},
        },
      ];
      const mockPaginator: Paginator<Omit<LensEntry, "data">[]> = {
        data: mockLogEntries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      };
      mockStore.paginate.mockResolvedValue(mockPaginator);

      const result = await ApiController.getLogEntries({
        qs: { perPage: "10" },
      });

      expect(mockStore.paginate).toHaveBeenCalledWith(
        WatcherTypeEnum.LOG,
        { perPage: 10 },
        false,
      );
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockLogEntries,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      });
    });
  });

  describe("getLogEntry", () => {
    it("should return a single log entry", async () => {
      const mockLogEntry: LensEntry = {
        id: "log1",
        type: WatcherTypeEnum.LOG,
        created_at: "now",
        lens_entry_id: "req1",
        data: { level: "error", message: "boom" },
      };
      mockStore.find.mockResolvedValue(mockLogEntry);

      const result = await ApiController.getLogEntry({
        params: { id: "log1" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(WatcherTypeEnum.LOG, "log1");
      expect(result).toEqual({
        status: 200,
        message: "Data fetched successfully",
        data: mockLogEntry,
      });
    });

    it("should return 404 if log entry not found", async () => {
      mockStore.find.mockResolvedValue(null);

      const result = await ApiController.getLogEntry({
        params: { id: "nonexistent" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.LOG,
        "nonexistent",
      );
      expect(result).toEqual({
        status: 404,
        message: "Could not find the requested resource",
        data: null,
      });
    });
  });

  describe("getJobEntries / getJobEntry", () => {
    it("returns paginated jobs (minimal, JOB type)", async () => {
      const mockJobs: Omit<LensEntry, "data">[] = [
        {
          id: "emails:1",
          type: WatcherTypeEnum.JOB,
          created_at: "now",
          lens_entry_id: null,
          data: {},
        },
      ];
      mockStore.paginate.mockResolvedValue({
        data: mockJobs,
        meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 100 },
      });

      const result = await ApiController.getJobEntries({ qs: { perPage: "10" } });

      expect(mockStore.paginate).toHaveBeenCalledWith(
        WatcherTypeEnum.JOB,
        { perPage: 10 },
        false,
      );
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockJobs);
    });

    it("returns a single job by id", async () => {
      const mockJob: LensEntry = {
        id: "emails:1",
        type: WatcherTypeEnum.JOB,
        created_at: "now",
        lens_entry_id: null,
        data: { name: "sendEmail", status: "completed" },
      };
      mockStore.find.mockResolvedValue(mockJob);

      const result = await ApiController.getJobEntry({
        params: { id: "emails:1" },
        qs: {},
      });

      expect(mockStore.find).toHaveBeenCalledWith(
        WatcherTypeEnum.JOB,
        "emails:1",
      );
      expect(result.data).toEqual(mockJob);
    });
  });

  describe("truncate", () => {
    it("should call store.truncate and return success response", async () => {
      mockStore.truncate.mockResolvedValue(undefined);

      const result = await ApiController.truncate();

      expect(mockStore.truncate).toHaveBeenCalled();
      expect(result).toEqual({
        status: 200,
        message: "All entries cleared",
        data: {},
      });
    });
  });

  describe("fetchUiConfig", () => {
    it("should return the UI config", () => {
      const mockUiConfig = { appName: "TestApp", path: "/lens", enabled: true };
      (getUiConfig as Mock).mockReturnValue(mockUiConfig);

      const result = ApiController.fetchUiConfig();

      expect(getUiConfig).toHaveBeenCalled();
      expect(result).toEqual(mockUiConfig);
    });
  });

  describe("extractListParams", () => {
    it("should return default perPage with no cursor if no qs", () => {
      const result = (ApiController as any).extractListParams();
      expect(result).toEqual({ cursor: undefined, perPage: 100 });
    });

    it("should return default perPage with no cursor if qs is empty", () => {
      const result = (ApiController as any).extractListParams({});
      expect(result).toEqual({ cursor: undefined, perPage: 100 });
    });

    it("should parse a valid cursor and perPage", () => {
      const result = (ApiController as any).extractListParams({
        cursor: "42",
        perPage: "20",
      });
      expect(result).toEqual({ cursor: 42, after: undefined, perPage: 20 });
    });

    it("should parse a valid `after` cursor for delta polling", () => {
      const result = (ApiController as any).extractListParams({
        after: "42",
        perPage: "20",
      });
      expect(result).toEqual({ cursor: undefined, after: 42, perPage: 20 });
    });

    it("should cap perPage at 100", () => {
      const result = (ApiController as any).extractListParams({
        perPage: "200",
      });
      expect(result).toEqual({ cursor: undefined, perPage: 100 });
    });

    it("should set perPage to 100 if less than 5", () => {
      const result = (ApiController as any).extractListParams({
        perPage: "3",
      });
      expect(result).toEqual({ cursor: undefined, perPage: 100 });
    });

    it("should ignore invalid (non-numeric) cursor values", () => {
      const result = (ApiController as any).extractListParams({
        cursor: "abc",
        perPage: "10",
      });
      expect(result).toEqual({ cursor: undefined, perPage: 10 });
    });

    it("should ignore non-positive cursor values", () => {
      const result = (ApiController as any).extractListParams({
        cursor: "0",
        perPage: "10",
      });
      expect(result).toEqual({ cursor: undefined, perPage: 10 });
    });

    it("parses search, date-range, and sort params", () => {
      const result = (ApiController as any).extractListParams({
        q: "  boom  ",
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-02T00:00:00.000Z",
        sort: "duration",
        dir: "asc",
        numericSort: "true",
      });
      expect(result).toMatchObject({
        q: "boom",
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-02T00:00:00.000Z",
        sort: "duration",
        dir: "asc",
        numericSort: true,
      });
    });

    it("collects non-reserved keys as field filters (with operators)", () => {
      const result = (ApiController as any).extractListParams({
        method: "GET",
        status__gte: "200",
        status__lt: "300",
      });
      expect(result.filters).toEqual([
        { field: "method", op: "eq", value: "GET" },
        { field: "status", op: "gte", value: "200" },
        { field: "status", op: "lt", value: "300" },
      ]);
    });

    it("rejects unknown operators and unsafe filter keys", () => {
      const result = (ApiController as any).extractListParams({
        "status__bogus": "1",
        "a;drop": "1",
        level: "error",
      });
      expect(result.filters).toEqual([
        { field: "level", op: "eq", value: "error" },
      ]);
    });

    it("omits filters when there are none", () => {
      const result = (ApiController as any).extractListParams({ perPage: "10" });
      expect(result.filters).toBeUndefined();
    });
  });
});
