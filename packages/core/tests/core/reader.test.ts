import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { createLensReader } from "../../src/core/reader";
import Store from "../../src/abstracts/store";
import { WatcherTypeEnum, LensEntry } from "../../src/types";

class MockStore extends Store {
  initialize = vi.fn();
  save = vi.fn();
  getAllRequests = vi.fn();
  getAllQueries = vi.fn();
  getAllCacheEntries = vi.fn();
  getAllExceptions = vi.fn();
  getAllEmails = vi.fn();
  allByRequestId = vi.fn();
  find = vi.fn();
  truncate = vi.fn();
  paginate = vi.fn();
  count = vi.fn();
  latest = vi.fn();
}

describe("createLensReader", () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("forwards the type and every server-side list option to the store", async () => {
      const reader = createLensReader(store);
      const pagination = {
        perPage: 20,
        q: "timeout",
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-02T00:00:00.000Z",
        filters: [{ field: "status", op: "gte" as const, value: "500" }],
        sort: "duration",
        numericSort: true,
      };

      await reader.list(WatcherTypeEnum.REQUEST, pagination);

      expect(store.paginate).toHaveBeenCalledWith(
        WatcherTypeEnum.REQUEST,
        pagination,
        false,
      );
    });

    it("reads full entry data only when asked", async () => {
      const reader = createLensReader(store);
      const pagination = { perPage: 20 };

      await reader.list(WatcherTypeEnum.QUERY, pagination, true);

      expect(store.paginate).toHaveBeenCalledWith(
        WatcherTypeEnum.QUERY,
        pagination,
        true,
      );
    });

    it("reads the latest cross-type feed without full data", async () => {
      const reader = createLensReader(store);
      const pagination = { perPage: 50 };

      await reader.latest(pagination);

      expect(store.latest).toHaveBeenCalledWith(pagination, false);
    });
  });

  describe("getRequestTimeline", () => {
    it("returns null when the request does not exist", async () => {
      (store.find as Mock).mockResolvedValue(null);
      const reader = createLensReader(store);

      const result = await reader.getRequestTimeline("missing");

      expect(result).toBeNull();
      expect(store.find).toHaveBeenCalledWith(WatcherTypeEnum.REQUEST, "missing");
      expect(store.allByRequestId).not.toHaveBeenCalled();
    });

    it("correlates every signal to the request", async () => {
      const request: LensEntry = {
        id: "req-1",
        type: WatcherTypeEnum.REQUEST,
        created_at: "now",
        lens_entry_id: null,
        data: { method: "GET", path: "/x" },
      };
      const queries: LensEntry[] = [
        {
          id: "q-1",
          type: WatcherTypeEnum.QUERY,
          created_at: "now",
          lens_entry_id: "req-1",
          data: { query: "SELECT 1" },
        },
      ];

      (store.find as Mock).mockResolvedValue(request);
      (store.allByRequestId as Mock).mockImplementation((_id, type) =>
        Promise.resolve(type === WatcherTypeEnum.QUERY ? queries : []),
      );

      const reader = createLensReader(store);
      const result = await reader.getRequestTimeline("req-1");

      // Exceptions and emails are fetched without full data (minimal).
      expect(store.allByRequestId).toHaveBeenCalledWith(
        "req-1",
        WatcherTypeEnum.EXCEPTION,
        false,
      );
      expect(store.allByRequestId).toHaveBeenCalledWith(
        "req-1",
        WatcherTypeEnum.MAIL,
        false,
      );
      expect(store.allByRequestId).toHaveBeenCalledWith(
        "req-1",
        WatcherTypeEnum.QUERY,
      );
      expect(store.allByRequestId).toHaveBeenCalledWith(
        "req-1",
        WatcherTypeEnum.LOG,
      );
      expect(store.allByRequestId).toHaveBeenCalledWith(
        "req-1",
        WatcherTypeEnum.JOB,
      );

      expect(result).toEqual({
        request,
        queries,
        cacheEntries: [],
        exceptions: [],
        emails: [],
        httpEntries: [],
        eventEntries: [],
        redisEntries: [],
        fcmEntries: [],
        logEntries: [],
        jobEntries: [],
      });
    });
  });

  describe("find", () => {
    it("resolves a single entry of any type by id", async () => {
      const reader = createLensReader(store);

      await reader.find(WatcherTypeEnum.EXCEPTION, "exc-1");
      await reader.find(WatcherTypeEnum.JOB, "job-1");

      expect(store.find).toHaveBeenCalledWith(WatcherTypeEnum.EXCEPTION, "exc-1");
      expect(store.find).toHaveBeenCalledWith(WatcherTypeEnum.JOB, "job-1");
    });
  });

  describe("analytics", () => {
    it("computes an overview for the requested window", async () => {
      (store.paginate as Mock).mockResolvedValue({ meta: {}, data: [] });
      const reader = createLensReader(store);

      const overview = await reader.getOverview({
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-01T01:00:00.000Z",
      });

      expect(overview.range.from).toBe("2025-01-01T00:00:00.000Z");
      expect(overview.summary.totalRequests).toBe(0);
    });

    it("groups exceptions in the window by fingerprint", async () => {
      const exception = (id: string, fingerprint: string): LensEntry => ({
        id,
        type: WatcherTypeEnum.EXCEPTION,
        created_at: "2025-01-01T00:00:00.000Z",
        lens_entry_id: null,
        data: { name: "TypeError", message: "boom", fingerprint },
      });
      (store.paginate as Mock).mockResolvedValue({
        meta: {},
        data: [exception("e1", "fp1"), exception("e2", "fp1"), exception("e3", "fp2")],
      });

      const reader = createLensReader(store);
      const groups = await reader.getExceptionGroups({ limit: 5 });

      expect(store.paginate).toHaveBeenCalledWith(
        WatcherTypeEnum.EXCEPTION,
        expect.objectContaining({ perPage: 20_000 }),
        false,
      );
      expect(groups).toHaveLength(2);
      expect(groups[0]).toMatchObject({ fingerprint: "fp1", count: 2 });
      expect(groups[1]).toMatchObject({ fingerprint: "fp2", count: 1 });
    });
  });
});
