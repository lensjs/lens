import { describe, it, expect, vi, beforeEach, Mock} from "vitest";
import { emitCacheEvent } from "../src/cache";
import { lensEmitter, lensContext } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

// Mock dependencies
vi.mock("@lensjs/core", () => ({
  lensEmitter: {
    emit: vi.fn(),
  },
  lensContext: {
    getStore: vi.fn(),
  },
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(),
}));

describe("emitCacheEvent", () => {
  const MOCKED_REQUEST_ID = "test-request-id";
  const MOCKED_NOW_ISO = "2025-09-05T10:00:00Z";

  beforeEach(() => {
    vi.clearAllMocks();
    (nowISO as Mock).mockReturnValue(MOCKED_NOW_ISO);
    (lensContext.getStore as Mock).mockReturnValue({
      requestId: MOCKED_REQUEST_ID,
    });
  });

  it("should emit a cache event with correct payload when data is provided", () => {
    const cacheData = {
      action: "set",
      data: {
        key: "user:1",
        value: { name: "John Doe" },
      },
    };

    emitCacheEvent(cacheData);

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
    expect(lensEmitter.emit).toHaveBeenCalledWith("cache", {
      action: "set",
      createdAt: MOCKED_NOW_ISO,
      data: {
        key: "user:1",
        value: { name: "John Doe" },
      },
      requestId: MOCKED_REQUEST_ID,
    });
  });

  it("should emit a cache event with correct payload when data is not explicitly provided (e.g., delete)", () => {
    const cacheData = {
      action: "delete",
      data: {
        key: "user:1",
      },
    };

    emitCacheEvent(cacheData);

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
    expect(lensEmitter.emit).toHaveBeenCalledWith("cache", {
      action: "delete",
      createdAt: MOCKED_NOW_ISO,
      data: {
        key: "user:1",
      }, // Should be an empty object if no data property
      requestId: MOCKED_REQUEST_ID,
    });
  });

  it("should handle null or undefined requestId gracefully", () => {
    (lensContext.getStore as Mock).mockReturnValue(undefined); // No store, so no requestId

    const cacheData = {
      action: "get",
      key: "user:1",
    };

    emitCacheEvent(cacheData);

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
    expect(lensEmitter.emit).toHaveBeenCalledWith("cache", {
      action: "get",
      createdAt: MOCKED_NOW_ISO,
      data: {},
      requestId: undefined, // Expect undefined requestId
    });
  });
});
