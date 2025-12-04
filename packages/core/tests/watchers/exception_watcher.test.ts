import { describe, it, expect, vi, beforeEach } from "vitest";
import ExceptionWatcher from "../../src/watchers/exception_watcher";
import { getStore } from "../../src/context/context";
import { WatcherTypeEnum } from "../../src/types";
import LensStore from "../../src/abstracts/store";
import * as lensUtils from "../../src/utils"; // Import lensUtils
import { constructErrorObject } from "../../src/utils/exception";

// Mock the getStore function
vi.mock("../../src/context/context", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/context/context")>();
  return {
    ...actual,
    getStore: vi.fn(),
  };
});

// Mock generateRandomUuid
vi.mock("../../src/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils")>();
  return {
    ...actual,
    generateRandomUuid: vi.fn(() => "mock-uuid"),
  };
});

// Mock implementation for LensStore
class MockStore extends LensStore {
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

describe("ExceptionWatcher", () => {
  let watcher: ExceptionWatcher;
  let mockStore: MockStore;

  beforeEach(() => {
    mockStore = new MockStore();
    vi.mocked(getStore).mockReturnValue(mockStore);
    watcher = new ExceptionWatcher();
    vi.clearAllMocks();
    // @ts-ignore
    vi.mocked(lensUtils.generateRandomUuid).mockReturnValue("mock-uuid");
  });

  it("should have the correct name", () => {
    expect(watcher.name).toBe(WatcherTypeEnum.EXCEPTION);
  });

  describe("log", () => {
    it("should save the exception data to the store", async () => {
      const exceptionData = constructErrorObject(new Error("TestError"));
      await watcher.log(exceptionData);

      expect(mockStore.save).toHaveBeenCalledWith({
        id: "mock-uuid",
        type: WatcherTypeEnum.EXCEPTION,
        requestId: undefined,
        timestamp: exceptionData.createdAt,
        data: exceptionData,
        minimal_data: {
          name: exceptionData.name,
          message: exceptionData.message,
          createdAt: exceptionData.createdAt,
        },
      });
    });

    it("should save the exception data with requestId if provided", async () => {
      const exceptionData = {
        ...constructErrorObject(new Error("TestError")),
        requestId: "mock-request-id",
      };
      await watcher.log(exceptionData);

      expect(mockStore.save).toHaveBeenCalledWith({
        id: "mock-uuid",
        type: WatcherTypeEnum.EXCEPTION,
        requestId: exceptionData.requestId,
        timestamp: exceptionData.createdAt,
        data: exceptionData,
        minimal_data: {
          name: exceptionData.name,
          message: exceptionData.message,
          createdAt: exceptionData.createdAt,
        },
      });
    });
  });
});
