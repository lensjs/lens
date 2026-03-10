import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import MailWatcher from "../../src/watchers/mail_watcher";
import { WatcherTypeEnum, type MailEntry } from "../../src/types";
import Store from "../../src/abstracts/store";
import { nowISO } from "@lensjs/date";

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

// Mock @lensjs/date
vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-01-01T00:00:00.000Z"),
}));

import { getStore } from "../../src/context/context";

describe("MailWatcher", () => {
  let mockStore: MockStore;
  let mailWatcher: MailWatcher;

  beforeEach(() => {
    mockStore = new MockStore();
    (getStore as Mock).mockReturnValue(mockStore);
    mailWatcher = new MailWatcher();
    vi.clearAllMocks();
  });

  it("should have the correct name", () => {
    expect(mailWatcher.name).toBe(WatcherTypeEnum.MAIL);
  });

  describe("log", () => {
    it("should save mail entry with fully formed data", async () => {
      const mailEntry: MailEntry = {
        requestId: "request-123",
        from: [{ address: "sender@example.com", name: "Sender" }],
        to: [{ address: "receiver@example.com" }],
        subject: "Test Subject",
        date: "2025-09-05T10:00:00.000Z",
        headers: [],
        mime: { contentType: "text/plain", body: "Hello", headers: [] },
        meta: {
          driver: "nodemailer",
          status: "sent",
          sentAt: "2025-09-05T10:00:00.000Z",
        },
      };

      await mailWatcher.log(mailEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: "request-123",
        type: WatcherTypeEnum.MAIL,
        minimal_data: {
          subject: "Test Subject",
          recipientsCount: 1,
          createdAt: "2025-09-05T10:00:00.000Z",
        },
        data: mailEntry,
      });
    });

    it("should handle missing requestId and subject gracefully", async () => {
      const mailEntry: any = {
        from: [{ address: "sender@example.com" }],
        to: [{ address: "receiver@example.com" }],
        date: "2025-09-05T10:00:00.000Z",
        headers: [],
        mime: { contentType: "text/plain", body: "Hello", headers: [] },
        meta: {
          driver: "nodemailer",
          status: "sent",
        },
      };

      await mailWatcher.log(mailEntry);

      expect(mockStore.save).toHaveBeenCalledWith({
        requestId: "",
        type: WatcherTypeEnum.MAIL,
        minimal_data: {
          subject: "",
          recipientsCount: 1,
          createdAt: "2025-09-05T10:00:00.000Z",
        },
        data: mailEntry,
      });
    });

    it("should use nowISO if date is missing in mail entry", async () => {
      const mailEntry: any = {
        requestId: "request-456",
        subject: "No Date Email",
        from: [{ address: "sender@example.com" }],
        to: [{ address: "receiver@example.com" }],
        headers: [],
        mime: { contentType: "text/plain", body: "Hello", headers: [] },
        meta: {
          driver: "nodemailer",
          status: "sent",
        },
      };

      const mockedNow = "2025-01-01T00:00:00.000Z";
      (nowISO as Mock).mockReturnValue(mockedNow);

      await mailWatcher.log(mailEntry);

      expect(mockStore.save).toHaveBeenCalledWith(expect.objectContaining({
        minimal_data: {
          subject: "No Date Email",
          recipientsCount: 1,
          createdAt: mockedNow,
        },
      }));
    });
  });
});
