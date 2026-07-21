import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { withLensRedis } from "../src/redis";
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

describe("withLensRedis", () => {
  const REQUEST_ID = "req-1";
  const NOW = "2025-09-05T10:00:00Z";

  beforeEach(() => {
    vi.clearAllMocks();
    (nowISO as Mock).mockReturnValue(NOW);
    (getCurrentRequestId as Mock).mockReturnValue(REQUEST_ID);
  });

  it("captures a successful command with args correlated to the request", async () => {
    const client = {
      sendCommand: vi.fn().mockResolvedValue("OK"),
    };

    withLensRedis(client);
    await client.sendCommand({ name: "set", args: ["k", "v"] });
    await flush();

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
    const [event, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(event).toBe("redis");
    expect(payload).toMatchObject({
      command: "SET",
      args: ["k", "v"],
      status: "success",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
    expect(payload.duration).toContain("ms");
  });

  it("redacts AUTH arguments", async () => {
    const client = { sendCommand: vi.fn().mockResolvedValue("OK") };

    withLensRedis(client);
    await client.sendCommand({ name: "auth", args: ["super-secret"] });
    await flush();

    const [, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(payload.command).toBe("AUTH");
    expect(payload.args).toEqual(["Purged By Lens"]);
  });

  it("captures a failed command", async () => {
    const client = {
      sendCommand: vi.fn().mockRejectedValue(new Error("WRONGTYPE")),
    };

    withLensRedis(client);
    await expect(
      client.sendCommand({ name: "incr", args: ["k"] }),
    ).rejects.toThrow("WRONGTYPE");
    await flush();

    const [, payload] = (lensEmitter.emit as Mock).mock.calls[0];
    expect(payload).toMatchObject({
      command: "INCR",
      status: "failed",
      error: "WRONGTYPE",
    });
  });

  it("is idempotent (does not double-wrap)", async () => {
    const client = { sendCommand: vi.fn().mockResolvedValue("OK") };

    withLensRedis(client);
    withLensRedis(client);
    await client.sendCommand({ name: "get", args: ["k"] });
    await flush();

    expect(lensEmitter.emit).toHaveBeenCalledTimes(1);
  });
});
