import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { EventEmitter } from "node:events";
import { lensEmitter, getCurrentRequestId } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import {
  emitLensJob,
  attachBullmqLens,
  attachAgendaLens,
} from "../src/job";

vi.mock("@lensjs/core", () => ({
  lensEmitter: { emit: vi.fn() },
  getCurrentRequestId: vi.fn(),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(),
}));

const REQUEST_ID = "req-1";
const NOW = "2025-09-05T10:00:00Z";
const emitMock = lensEmitter.emit as Mock;

const lastJob = (): Record<string, any> | undefined =>
  emitMock.mock.calls
    .filter((c) => c[0] === "job")
    .map((c) => c[1])
    .pop();

beforeEach(() => {
  vi.clearAllMocks();
  (nowISO as Mock).mockReturnValue(NOW);
  (getCurrentRequestId as Mock).mockReturnValue(REQUEST_ID);
});

afterEach(() => vi.restoreAllMocks());

describe("emitLensJob", () => {
  it("emits a correlated job entry with defaults filled in", () => {
    emitLensJob({ id: "q:1", name: "n", queue: "q", status: "active" });
    expect(lensEmitter.emit).toHaveBeenCalledWith("job", {
      id: "q:1",
      name: "n",
      queue: "q",
      status: "active",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
  });
});

describe("attachBullmqLens", () => {
  it("captures active -> completed with a stable id, duration, and result", () => {
    const worker = new EventEmitter() as any;
    worker.name = "emails";
    attachBullmqLens(worker);

    const job = {
      id: "1",
      name: "sendEmail",
      queueName: "emails",
      attemptsMade: 0,
      timestamp: 1735689600000, // 2025-01-01T00:00:00.000Z
      data: { to: "x" },
    };

    worker.emit("active", job);
    expect(lastJob()).toMatchObject({
      id: "emails:1",
      name: "sendEmail",
      queue: "emails",
      status: "active",
      createdAt: "2025-01-01T00:00:00.000Z",
      requestId: REQUEST_ID,
    });

    worker.emit(
      "completed",
      { ...job, attemptsMade: 1, processedOn: 1735689600100, finishedOn: 1735689600150 },
      { ok: true },
    );
    expect(lastJob()).toMatchObject({
      id: "emails:1",
      status: "completed",
      attempts: 1,
      duration: "50 ms",
      result: { ok: true },
    });
  });

  it("captures failed with the error reason", () => {
    const worker = new EventEmitter() as any;
    attachBullmqLens(worker);
    worker.emit(
      "failed",
      { id: "9", name: "n", queueName: "q", attemptsMade: 3 },
      new Error("kaboom"),
    );
    expect(lastJob()).toMatchObject({
      id: "q:9",
      status: "failed",
      attempts: 3,
      failedReason: "kaboom",
    });
  });
});

describe("attachAgendaLens", () => {
  it("maps start/success/fail to active/completed/failed", () => {
    const agenda = new EventEmitter() as any;
    attachAgendaLens(agenda);

    const attrs = {
      _id: "abc",
      name: "report",
      data: { userId: 1 },
      lastRunAt: "2025-01-01T00:00:00.000Z",
    };

    agenda.emit("start", { attrs });
    expect(lastJob()).toMatchObject({
      id: "agenda:abc",
      name: "report",
      queue: "agenda",
      status: "active",
    });

    agenda.emit("fail", new Error("nope"), { attrs: { ...attrs, failCount: 2 } });
    expect(lastJob()).toMatchObject({
      id: "agenda:abc",
      status: "failed",
      attempts: 2,
      failedReason: "nope",
    });
  });
});
