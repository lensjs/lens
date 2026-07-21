import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { EventEmitter } from "node:events";
import { emitLensEvent, instrumentEmitter } from "../src/event";
import { lensEmitter, getCurrentRequestId } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

vi.mock("@lensjs/core", () => ({
  lensEmitter: { emit: vi.fn() },
  getCurrentRequestId: vi.fn(),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(),
}));

describe("event handler", () => {
  const REQUEST_ID = "req-1";
  const NOW = "2025-09-05T10:00:00Z";

  beforeEach(() => {
    vi.clearAllMocks();
    (nowISO as Mock).mockReturnValue(NOW);
    (getCurrentRequestId as Mock).mockReturnValue(REQUEST_ID);
  });

  it("emitLensEvent emits a correlated event", () => {
    emitLensEvent("user.registered", { id: 1 });

    expect(lensEmitter.emit).toHaveBeenCalledWith("event", {
      name: "user.registered",
      payload: { id: 1 },
      createdAt: NOW,
      requestId: REQUEST_ID,
    });
  });

  it("instrumentEmitter captures emits and preserves delivery", () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on("order.placed", listener);

    instrumentEmitter(emitter);
    emitter.emit("order.placed", { orderId: "1" });

    expect(listener).toHaveBeenCalledWith({ orderId: "1" });
    expect(lensEmitter.emit).toHaveBeenCalledWith("event", {
      name: "order.placed",
      payload: { orderId: "1" },
      createdAt: NOW,
      requestId: REQUEST_ID,
    });
  });

  it("instrumentEmitter ignores internal listener events", () => {
    const emitter = new EventEmitter();
    instrumentEmitter(emitter);
    emitter.on("noop", () => {});

    const captured = (lensEmitter.emit as Mock).mock.calls.map((c) => c[1].name);
    expect(captured).not.toContain("newListener");
  });
});
