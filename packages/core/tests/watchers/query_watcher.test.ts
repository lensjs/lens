import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import QueryWatcher from "../../src/watchers/query_watcher";
import { WatcherTypeEnum, type QueryEntry } from "../../src/types";
import Store from "../../src/abstracts/store";

// Mock Store implementation
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

// Mock the context module to control getStore
vi.mock("../../src/context/context", () => ({
  getStore: vi.fn(),
}));

import { getStore } from "../../src/context/context";

describe("QueryWatcher", () => {
  let mockStore: MockStore;
  let queryWatcher: QueryWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    queryWatcher = new QueryWatcher();
    vi.clearAllMocks();
  });

  it("should have the correct name", () => {
    expect(queryWatcher.name).toBe(WatcherTypeEnum.QUERY);
  });

  describe("log", () => {
    it("should save query entry with a requestId", async () => {
      const queryEntry: QueryEntry = {
        data: {
          type: "sql",
          duration: "10 ms",
          query: "SELECT * FROM users",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
        requestId: "request-1",
      };

      await queryWatcher.log(queryEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        type: WatcherTypeEnum.QUERY,
        data: queryEntry.data,
        requestId: "request-1",
      });
    });

    it("should save query entry without a requestId", async () => {
      const queryEntry: QueryEntry = {
        data: {
          type: "sql",
          duration: "5 ms",
          query: "INSERT INTO logs VALUES (1)",
          createdAt: "2025-01-01T00:01:00.000Z",
        },
      };

      await queryWatcher.log(queryEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        type: WatcherTypeEnum.QUERY,
        data: queryEntry.data,
        requestId: "",
      });
    });

    it("should save query entry with different data types", async () => {
      const queryEntry: QueryEntry = {
        data: {
          query: "SELECT * FROM users WHERE id = 1",
          type: "sql",
          duration: "20 ms",
          createdAt: "2025-01-01T00:02:00.000Z",
        },
        requestId: "request-2",
      };

      await queryWatcher.log(queryEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        type: WatcherTypeEnum.QUERY,
        data: queryEntry.data,
        requestId: "request-2",
      });
    });
  });
});
