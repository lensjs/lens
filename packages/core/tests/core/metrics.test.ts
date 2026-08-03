import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLensMetrics } from "../../src/core/metrics";
import Store from "../../src/abstracts/store";
import { WatcherTypeEnum, type LensEntry } from "../../src/types";

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

const row = (
  type: WatcherTypeEnum,
  id: string,
  data: Record<string, any>,
): LensEntry => ({
  id,
  type,
  created_at: String(data.createdAt ?? "2025-01-01T00:00:00.000Z"),
  lens_entry_id: null,
  data,
});

const FROM = "2025-01-01T00:00:00.000Z";
const TO = "2025-01-01T01:00:00.000Z"; // 1h span -> minute granularity

describe("createLensMetrics", () => {
  let store: MockStore;

  const requests: LensEntry[] = Array.from({ length: 10 }, (_, i) =>
    row(WatcherTypeEnum.REQUEST, `r${i}`, {
      method: "GET",
      path: i < 7 ? "/a" : "/b",
      status: i === 9 ? 500 : i === 8 ? 404 : 200,
      duration: `${(i + 1) * 10} ms`,
      createdAt:
        i < 5 ? "2025-01-01T00:00:30.000Z" : "2025-01-01T00:01:30.000Z",
    }),
  );

  const exceptions: LensEntry[] = [
    row(WatcherTypeEnum.EXCEPTION, "e1", {
      name: "TypeError",
      message: "boom",
      createdAt: "2025-01-01T00:00:10.000Z",
    }),
    row(WatcherTypeEnum.EXCEPTION, "e2", {
      name: "TypeError",
      message: "boom",
      createdAt: "2025-01-01T00:00:20.000Z",
    }),
    row(WatcherTypeEnum.EXCEPTION, "e3", {
      name: "RangeError",
      message: "oops",
      createdAt: "2025-01-01T00:00:05.000Z",
    }),
  ];

  const queries: LensEntry[] = [
    row(WatcherTypeEnum.QUERY, "q1", { query: "SELECT 1", duration: "50 ms" }),
    row(WatcherTypeEnum.QUERY, "q2", { query: "SELECT 2", duration: "5 ms" }),
  ];

  beforeEach(() => {
    store = new MockStore();
    (store.paginate as any).mockImplementation((type: WatcherTypeEnum) => {
      const data =
        type === WatcherTypeEnum.REQUEST
          ? requests
          : type === WatcherTypeEnum.EXCEPTION
            ? exceptions
            : type === WatcherTypeEnum.QUERY
              ? queries
              : [];
      return Promise.resolve({ meta: {}, data });
    });
  });

  it("fetches each signal for the window (queries with full data)", async () => {
    await createLensMetrics(store).getOverview({ from: FROM, to: TO });

    expect(store.paginate).toHaveBeenCalledWith(
      WatcherTypeEnum.REQUEST,
      expect.objectContaining({ from: FROM, to: TO }),
      false,
    );
    expect(store.paginate).toHaveBeenCalledWith(
      WatcherTypeEnum.EXCEPTION,
      expect.objectContaining({ from: FROM, to: TO }),
      false,
    );
    expect(store.paginate).toHaveBeenCalledWith(
      WatcherTypeEnum.QUERY,
      expect.objectContaining({ from: FROM, to: TO }),
      true,
    );
  });

  it("computes summary percentiles and error rates", async () => {
    const o = await createLensMetrics(store).getOverview({ from: FROM, to: TO });

    expect(o.range.granularity).toBe("minute");
    expect(o.summary.totalRequests).toBe(10);
    expect(o.summary.p50).toBe(50);
    expect(o.summary.p95).toBe(100);
    expect(o.summary.p99).toBe(100);
    expect(o.summary.errorRate).toBeCloseTo(0.1); // one 5xx of 10
    expect(o.summary.clientErrorRate).toBeCloseTo(0.1); // one 4xx of 10
    expect(o.summary.totalExceptions).toBe(3);
    expect(o.summary.totalQueries).toBe(2);
    expect(o.summary.avgQueryTime).toBeCloseTo(27.5);
  });

  it("buckets throughput by minute", async () => {
    const o = await createLensMetrics(store).getOverview({ from: FROM, to: TO });

    expect(o.throughput).toEqual([
      { bucket: "2025-01-01T00:00", total: 5, errors: 0 },
      { bucket: "2025-01-01T00:01", total: 5, errors: 1 },
    ]);
  });

  it("ranks slowest endpoints by p95 and groups by method+path", async () => {
    const o = await createLensMetrics(store).getOverview({ from: FROM, to: TO });

    expect(o.slowestEndpoints.map((e) => ({ path: e.path, count: e.count }))).toEqual([
      { path: "/b", count: 3 },
      { path: "/a", count: 7 },
    ]);
    expect(o.slowestEndpoints[0]!.p95).toBe(100);
  });

  it("returns slowest queries and top exceptions grouped by name+message", async () => {
    const o = await createLensMetrics(store).getOverview({ from: FROM, to: TO });

    expect(o.slowestQueries.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(o.slowestQueries[0]!.duration).toBe(50);

    expect(o.topExceptions).toEqual([
      expect.objectContaining({ name: "TypeError", count: 2, sampleId: "e2" }),
      expect.objectContaining({ name: "RangeError", count: 1, sampleId: "e3" }),
    ]);
  });

  it("ignores unparseable from/to instead of producing NaN metrics", async () => {
    const o = await createLensMetrics(store).getOverview({
      from: "not-a-date",
      to: "garbage",
    });

    expect(Number.isNaN(Date.parse(o.range.from))).toBe(false);
    expect(Number.isNaN(Date.parse(o.range.to))).toBe(false);
    expect(Number.isFinite(o.summary.requestsPerMinute)).toBe(true);
    expect(o.summary.totalRequests).toBe(10);
    // A bad window must still fetch with a valid (defaulted) range.
    expect(store.paginate).toHaveBeenCalledWith(
      WatcherTypeEnum.REQUEST,
      expect.objectContaining({
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      }),
      false,
    );
  });
});
