import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import JobWatcher from "../../src/watchers/job_watcher";
import { getStore } from "../../src/context/context";
import Store from "../../src/abstracts/store";
import { WatcherTypeEnum, JobEntry } from "../../src/types";

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

describe("JobWatcher", () => {
  let mockStore: MockStore;
  let jobWatcher: JobWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    jobWatcher = new JobWatcher();
    vi.clearAllMocks();
  });

  it("should have the correct name", () => {
    expect(jobWatcher.name).toBe(WatcherTypeEnum.JOB);
  });

  it("saves with the stable id + timestamp so the store upserts one row", async () => {
    const entry: JobEntry = {
      id: "emails:1",
      name: "sendEmail",
      queue: "emails",
      status: "completed",
      attempts: 1,
      duration: "50 ms",
      data: { to: "x" },
      result: { ok: true },
      requestId: "req123",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    await jobWatcher.log(entry);

    expect(mockStore.save).toHaveBeenCalledWith({
      id: "emails:1",
      requestId: "req123",
      type: WatcherTypeEnum.JOB,
      timestamp: "2025-01-01T00:00:00.000Z",
      minimal_data: {
        name: "sendEmail",
        queue: "emails",
        status: "completed",
        attempts: 1,
        duration: "50 ms",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      data: entry,
    });
  });

  it("defaults requestId to an empty string when absent", async () => {
    const entry: JobEntry = {
      id: "emails:2",
      name: "sendEmail",
      queue: "emails",
      status: "active",
      createdAt: "2025-01-01T00:01:00.000Z",
    };

    await jobWatcher.log(entry);

    expect(mockStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "emails:2",
        requestId: "",
        type: WatcherTypeEnum.JOB,
        timestamp: "2025-01-01T00:01:00.000Z",
      }),
    );
  });
});
