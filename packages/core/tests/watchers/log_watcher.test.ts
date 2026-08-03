import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import LogWatcher from "../../src/watchers/log_watcher";
import { getStore } from "../../src/context/context";
import Store from "../../src/abstracts/store";
import { WatcherTypeEnum, LogEntry } from "../../src/types";

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

vi.mock("../../src/context/context", () => ({
  getStore: vi.fn(),
}));

describe("LogWatcher", () => {
  let mockStore: MockStore;
  let logWatcher: LogWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    logWatcher = new LogWatcher();
    vi.clearAllMocks();
  });

  it("should have the correct name", () => {
    expect(logWatcher.name).toBe(WatcherTypeEnum.LOG);
  });

  describe("log", () => {
    it("should save a log entry with minimal data and full data", async () => {
      const entry: LogEntry = {
        level: "error",
        message: "Something failed",
        context: { orderId: "1" },
        source: "pino",
        requestId: "req123",
        createdAt: "2023-01-01T12:00:00Z",
      };

      await logWatcher.log(entry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: "req123",
        type: WatcherTypeEnum.LOG,
        minimal_data: {
          level: "error",
          message: "Something failed",
          source: "pino",
          createdAt: "2023-01-01T12:00:00Z",
        },
        data: entry,
      });
    });

    it("should default requestId to an empty string when absent", async () => {
      const entry: LogEntry = {
        level: "info",
        message: "hello",
        createdAt: "2023-01-01T12:05:00Z",
      };

      await logWatcher.log(entry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: "",
        type: WatcherTypeEnum.LOG,
        minimal_data: {
          level: "info",
          message: "hello",
          source: undefined,
          createdAt: "2023-01-01T12:05:00Z",
        },
        data: entry,
      });
    });
  });
});
