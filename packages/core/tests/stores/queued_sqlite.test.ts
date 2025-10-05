import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import QueuedSqliteStore from "../../src/stores/queued_sqlite";
import BetterSqliteStore from "../../src/stores/better_sqlite";
import { WatcherTypeEnum } from "../../src/types";
import Database from "libsql";

class MockDenque {
  public queue: any[] = [];

  constructor() {
    this.queue = [];
  }

  push = vi.fn((...items: any[]) => {
    this.queue.push(...items);
  });

  get length() {
    return this.queue.length;
  }

  isEmpty = vi.fn(() => {
    return this.queue.length === 0;
  });

  remove = vi.fn((index: number, count: number) => {
    return this.queue.splice(index, count);
  });

  clear = vi.fn(() => {
    this.queue = [];
  });

  peekBack = vi.fn(() => {
    return this.queue[this.queue.length - 1];
  });
}

vi.mock("denque", () => {
  return {
    default: vi.fn(() => new MockDenque()),
  };
});

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

// Mock setInterval and clearInterval
const mockSetInterval = vi.fn(() => 123 as any); // Return a mock timer ID
const mockClearInterval = vi.fn();
vi.stubGlobal("setInterval", mockSetInterval);
vi.stubGlobal("clearInterval", mockClearInterval);

let store: QueuedSqliteStore;
let mockBetterSqliteStoreSave: Mock;
let mockBetterSqliteStoreInitialize: Mock;
let mockBetterSqliteStoreTruncate: Mock;
let mockConnection: any;

beforeEach(() => {
  vi.clearAllMocks();

  mockBetterSqliteStoreSave = vi.fn(async (entry) => Promise.resolve());
  mockBetterSqliteStoreInitialize = vi.fn(async () => Promise.resolve());
  mockBetterSqliteStoreTruncate = vi.fn(async () => Promise.resolve());

  // Mock the methods on the prototype of BetterSqliteStore
  vi.spyOn(BetterSqliteStore.prototype, "save").mockImplementation(
    mockBetterSqliteStoreSave as any,
  );
  vi.spyOn(BetterSqliteStore.prototype, "initialize").mockImplementation(
    mockBetterSqliteStoreInitialize as any,
  );
  vi.spyOn(BetterSqliteStore.prototype, "truncate").mockImplementation(
    mockBetterSqliteStoreTruncate as any,
  );

  store = new QueuedSqliteStore();

  // Clear the state of the mocked Denque instance for each test
  store.queue.clear();

  mockConnection = new Database("lens.db");
  (store as any).connection = mockConnection; // Inject the mock connection
});

describe("constructor", () => {
  it("should initialize with default config", () => {
    expect(store.BATCH_SIZE).toBe(100);
    expect(store.PROCESS_INTERVAL_MS).toBe(100);
    expect(store.WARN_THRESHOLD).toBe(100_000);
    expect(store.PREALLOCATE).toBe(true);
  });

  it("should initialize with custom config", () => {
    const customStore = new QueuedSqliteStore({
      batchSize: 50,
      processIntervalMs: 500,
      warnThreshold: 1000,
      preallocate: false,
    });
    expect(customStore.BATCH_SIZE).toBe(50);
    expect(customStore.PROCESS_INTERVAL_MS).toBe(500);
    expect(customStore.WARN_THRESHOLD).toBe(1000);
    expect(customStore.PREALLOCATE).toBe(false);
  });
});

describe("initialize", () => {
  it("should call super.initialize and start processing queue", async () => {
    await store.initialize();
    expect(mockBetterSqliteStoreInitialize).toHaveBeenCalled();
    expect(mockSetInterval).toHaveBeenCalledWith(
      expect.any(Function),
      store.PROCESS_INTERVAL_MS,
    );
  });
});

describe("truncate", () => {
  it("should clear the queue and call super.truncate", async () => {
    store.queue.push({ data: {}, type: WatcherTypeEnum.REQUEST });
    expect(store.queue.length).toBe(1);

    await store.truncate();
    expect(store.queue.length).toBe(0);
    expect(mockBetterSqliteStoreTruncate).toHaveBeenCalled();
  });
});

describe("save", () => {
  it("should add entry to the queue and not call super.save immediately", async () => {
    const entry = { data: { foo: "bar" }, type: WatcherTypeEnum.REQUEST };
    await store.save(entry);

    expect(store.queue.length).toBe(1);
    expect(store.queue.peekBack()).toEqual(entry);
    expect(mockBetterSqliteStoreSave).not.toHaveBeenCalled();
  });

  it("should log a warning if queue size exceeds WARN_THRESHOLD", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const originalWarnThreshold = store.WARN_THRESHOLD;
    (store as any).WARN_THRESHOLD = 1; // Temporarily set a low threshold

    await store.save({ data: {}, type: WatcherTypeEnum.REQUEST });
    await store.save({ data: {}, type: WatcherTypeEnum.REQUEST }); // This should trigger the warning

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("LensJs Queue size very large"),
    );
    consoleWarnSpy.mockRestore();
    (store as any).WARN_THRESHOLD = originalWarnThreshold; // Reset
  });
});

describe("processQueue", () => {
  it("should process a batch of entries and call super.save for each", async () => {
    const entry1 = { data: { a: 1 }, type: WatcherTypeEnum.REQUEST };
    const entry2 = { data: { b: 2 }, type: WatcherTypeEnum.QUERY };
    store.queue.push(entry1, entry2);

    expect(store.queue.length).toBe(2);
    expect(mockBetterSqliteStoreSave).not.toHaveBeenCalled();

    await store.processQueue();

    expect(store.queue.length).toBe(0);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledTimes(2);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entry1);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entry2);
  });

  it("should handle an empty queue gracefully", async () => {
    expect(store.queue.length).toBe(0);
    await store.processQueue();
    expect(mockBetterSqliteStoreSave).not.toHaveBeenCalled();
  });

  it("should process entries in batches", async () => {
    const originalBatchSize = store.BATCH_SIZE;
    (store as any).BATCH_SIZE = 2; // Set a small batch size

    const entries = Array.from({ length: 5 }, (_, i) => ({
      data: { id: i },
      type: WatcherTypeEnum.REQUEST,
    }));
    store.queue.push(...entries);

    expect(store.queue.length).toBe(5);

    await store.processQueue(); // First batch (2 items)
    expect(store.queue.length).toBe(3);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledTimes(2);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entries[0]);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entries[1]);

    mockBetterSqliteStoreSave.mockClear();
    await store.processQueue(); // Second batch (2 items)
    expect(store.queue.length).toBe(1);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledTimes(2);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entries[2]);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entries[3]);

    mockBetterSqliteStoreSave.mockClear();
    await store.processQueue(); // Third batch (1 item)
    expect(store.queue.length).toBe(0);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledTimes(1);
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entries[4]);

    (store as any).BATCH_SIZE = originalBatchSize; // Reset
  });

  it("should log an error if super.save fails for an entry", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockBetterSqliteStoreSave.mockRejectedValueOnce(new Error("Save failed"));

    const entry = { data: { a: 1 }, type: WatcherTypeEnum.REQUEST };
    store.queue.push(entry);

    await store.processQueue();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error saving queued entry:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});

describe("stopProcessingQueue", () => {
  it("should clear the interval and process remaining queue items", async () => {
    store.startProcessingQueue(); // Ensure interval is set
    expect(mockSetInterval).toHaveBeenCalled();

    const entry = { data: { a: 1 }, type: WatcherTypeEnum.REQUEST };
    store.queue.push(entry);

    await store.stopProcessingQueue();

    expect(mockClearInterval).toHaveBeenCalledWith(123);
    expect(store.processingInterval).toBeNull();
    expect(mockBetterSqliteStoreSave).toHaveBeenCalledWith(entry);
    expect(store.queue.length).toBe(0);
  });
});

describe("shutdown", () => {
  it("should stop processing queue and exit the process", async () => {
    const stopProcessingQueueSpy = vi.spyOn(store, "stopProcessingQueue");
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    await store.shutdown();

    expect(stopProcessingQueueSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);

    stopProcessingQueueSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
