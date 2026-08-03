import { describe, it, expect, vi } from "vitest";
import BetterSqliteStore from "../../src/stores/better_sqlite";
import { WatcherTypeEnum } from "../../src/types";

vi.mock("libsql", () => ({
  default: vi.fn(() => ({ prepare: vi.fn(), exec: vi.fn() })),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-01-01T00:00:00.000Z"),
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "mock-uuid"),
}));

describe("BetterSqliteStore.pruneOlderThan", () => {
  it("deletes by cutoff and type, returning the deleted count", async () => {
    const store = new BetterSqliteStore();
    const runMock = vi.fn(() => ({ changes: 3 }));
    const prepareMock = vi.fn(() => ({ run: runMock }));
    (store as any).connection = { prepare: prepareMock };

    const deleted = await store.pruneOlderThan(
      "2025-01-01T00:00:00.000Z",
      WatcherTypeEnum.QUERY,
    );

    expect(prepareMock).toHaveBeenCalledWith(
      "DELETE FROM lens_entries WHERE created_at < ? AND type = ?",
    );
    expect(runMock).toHaveBeenCalledWith("2025-01-01T00:00:00.000Z", "query");
    expect(deleted).toBe(3);
  });

  it("deletes by cutoff only when no type is given", async () => {
    const store = new BetterSqliteStore();
    const runMock = vi.fn(() => ({ changes: 0 }));
    const prepareMock = vi.fn(() => ({ run: runMock }));
    (store as any).connection = { prepare: prepareMock };

    const deleted = await store.pruneOlderThan("2025-01-01T00:00:00.000Z");

    expect(prepareMock).toHaveBeenCalledWith(
      "DELETE FROM lens_entries WHERE created_at < ?",
    );
    expect(runMock).toHaveBeenCalledWith("2025-01-01T00:00:00.000Z");
    expect(deleted).toBe(0);
  });
});
