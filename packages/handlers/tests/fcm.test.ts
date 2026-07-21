import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { withLensFcm } from "../src/fcm";
import { lensEmitter, getCurrentRequestId } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

vi.mock("@lensjs/core", () => ({
  lensEmitter: { emit: vi.fn() },
  getCurrentRequestId: vi.fn(),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(),
}));

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("withLensFcm", () => {
  const REQUEST_ID = "req-1";
  const NOW = "2025-09-05T10:00:00Z";

  beforeEach(() => {
    vi.clearAllMocks();
    (nowISO as Mock).mockReturnValue(NOW);
    (getCurrentRequestId as Mock).mockReturnValue(REQUEST_ID);
  });

  it("captures a successful single send correlated to the request", async () => {
    const messaging = {
      send: vi.fn().mockResolvedValue("projects/x/messages/42"),
    };

    withLensFcm(messaging);
    await messaging.send({
      token: "tok_1234567890_abcdefghijklmnop",
      notification: { title: "Hi", body: "There" },
      data: { k: "v" },
    });
    await flush();

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
    const [event, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(event).toBe("fcm");
    expect(payload).toMatchObject({
      method: "send",
      status: "success",
      title: "Hi",
      body: "There",
      data: { k: "v" },
      messageId: "projects/x/messages/42",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
    expect(payload.target).toMatch(/^token:tok_12345678/);
    expect(payload.target).toContain("…");
    expect(payload.duration).toContain("ms");
  });

  it("captures multicast success counts", async () => {
    const messaging = {
      sendEachForMulticast: vi
        .fn()
        .mockResolvedValue({ successCount: 2, failureCount: 1, responses: [] }),
    };

    withLensFcm(messaging);
    await messaging.sendEachForMulticast({
      tokens: ["a", "b", "c"],
      notification: { title: "Batch" },
    });
    await flush();

    const [, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(payload).toMatchObject({
      method: "sendEachForMulticast",
      status: "success",
      target: "3 tokens",
      title: "Batch",
      successCount: 2,
      failureCount: 1,
    });
  });

  it("captures per-recipient results for multicast", async () => {
    const messaging = {
      sendEachForMulticast: vi.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true, messageId: "m1" },
          {
            success: false,
            error: { code: "messaging/invalid", message: "bad token" },
          },
        ],
      }),
    };

    withLensFcm(messaging);
    await messaging.sendEachForMulticast({
      tokens: ["good-token", "bad-token"],
      notification: { title: "x" },
    });
    await flush();

    const [, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(payload.recipients).toEqual([
      {
        target: "token:good-token",
        success: true,
        messageId: "m1",
        error: undefined,
      },
      {
        target: "token:bad-token",
        success: false,
        messageId: undefined,
        error: "bad token",
      },
    ]);
  });

  it("captures a failed send with the error message", async () => {
    const messaging = {
      send: vi.fn().mockRejectedValue(new Error("token expired")),
    };

    withLensFcm(messaging);
    await expect(
      messaging.send({ token: "abc", notification: { title: "x" } }),
    ).rejects.toThrow("token expired");
    await flush();

    const [, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(payload).toMatchObject({
      method: "send",
      status: "failed",
      error: "token expired",
    });
  });

  it("is idempotent (does not double-wrap)", async () => {
    const send = vi.fn().mockResolvedValue("id");
    const messaging = { send };

    withLensFcm(messaging);
    withLensFcm(messaging);
    await messaging.send({ token: "abc" });
    await flush();

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
  });
});
