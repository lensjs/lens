import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import RequestWatcher from "../../src/watchers/request_watcher";
import { WatcherTypeEnum, type RequestEntry } from "../../src/types";
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

describe("RequestWatcher", () => {
  let mockStore: MockStore;
  let requestWatcher: RequestWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    requestWatcher = new RequestWatcher();
    vi.clearAllMocks();
  });

  it("should have the correct name", () => {
    expect(requestWatcher.name).toBe(WatcherTypeEnum.REQUEST);
  });

  describe("log", () => {
    it("should save request entry with full data", async () => {
      const requestEntry: RequestEntry = {
        request: {
          body: { key: "value" },
          id: "request-1",
          method: "POST",
          path: "/users",
          duration: "200 ms",
          createdAt: "2025-01-01T00:00:00.000Z",
          status: 201,
          ip: "127.0.0.1",
          headers: { "Content-Type": "application/json" },
        },
        user: { id: "user-1", name: "John Doe", email: "john@example.com" },
        response: {
          json: { message: "User created" },
          headers: { "X-Custom-Header": "test" },
        },
      };

      await requestWatcher.log(requestEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        id: "request-1",
        type: WatcherTypeEnum.REQUEST,
        minimal_data: {
          id: "request-1",
          method: "POST",
          path: "/users",
          duration: "200 ms",
          createdAt: "2025-01-01T00:00:00.000Z",
          status: 201,
        },
        data: {
          ...requestEntry.request,
          headers: { "content-type": "application/json" },
          user: requestEntry.user,
          response: {
            ...requestEntry.response,
            headers: { "x-custom-header": "test" },
          },
        },
      });
    });

    it("should save request entry with minimal data when user and response are missing", async () => {
      // @ts-expect-error
      const requestEntry: RequestEntry = {
        request: {
          body: {},
          id: "request-2",
          method: "GET",
          path: "/products",
          duration: "50 ms",
          createdAt: "2025-01-01T00:01:00.000Z",
          status: 200,
          ip: "192.168.1.1",
          headers: {},
        },
      };

      await requestWatcher.log(requestEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        id: "request-2",
        type: WatcherTypeEnum.REQUEST,
        minimal_data: {
          id: "request-2",
          method: "GET",
          path: "/products",
          duration: "50 ms",
          createdAt: "2025-01-01T00:01:00.000Z",
          status: 200,
        },
        data: {
          ...requestEntry.request,
          headers: {},
          user: undefined,
          response: { headers: {} },
        },
      });
    });

    it("should handle request entry with different request data", async () => {
      const requestEntry: RequestEntry = {
        request: {
          body: { query: "search term" },
          id: "request-3",
          method: "PUT",
          path: "/items/1",
          duration: "150 ms",
          createdAt: "2025-01-01T00:02:00.000Z",
          status: 200,
          ip: "10.0.0.5",
          headers: { Authorization: "Bearer token" },
        },
        user: { id: "user-2", name: "Jane Doe", email: "jane@example.com" },
        response: {
          json: { status: "updated" },
          headers: { "Content-Length": "20" },
        },
      };

      await requestWatcher.log(requestEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        id: "request-3",
        type: WatcherTypeEnum.REQUEST,
        minimal_data: {
          id: "request-3",
          method: "PUT",
          path: "/items/1",
          duration: "150 ms",
          createdAt: "2025-01-01T00:02:00.000Z",
          status: 200,
        },
        data: {
          ...requestEntry.request,
          headers: { authorization: "*******" },
          user: requestEntry.user,
          response: {
            ...requestEntry.response,
            headers: { "content-length": "20" },
          },
        },
      });
    });
  });
});
