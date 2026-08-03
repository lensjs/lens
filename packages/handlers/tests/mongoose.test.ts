import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  attachMongooseLens,
  createMongooseHandler,
} from "../src/query/mongoose";
import { watcherEmitter } from "../src/utils/emitter";

vi.mock("../src/utils/emitter", () => ({
  watcherEmitter: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("@lensjs/core", () => ({
  getCurrentRequestId: vi.fn(() => "test-request-id"),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-09-18T12:00:00.000Z"),
}));

describe("attachMongooseLens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers a debug hook that emits mongooseQuery in-context", () => {
    let debugFn: (...args: any[]) => void = () => {};
    const mongoose = {
      set: vi.fn((_key: string, fn: (...args: any[]) => void) => {
        debugFn = fn;
      }),
    };

    attachMongooseLens(mongoose as any);
    expect(mongoose.set).toHaveBeenCalledWith("debug", expect.any(Function));

    debugFn("users", "find", { age: { $gt: 18 } }, { limit: 10 });

    expect(watcherEmitter.emit).toHaveBeenCalledWith("mongooseQuery", {
      query: 'users.find({"age":{"$gt":18}}, {"limit":10})',
      requestId: "test-request-id",
    });
  });

  it("renders an operation with no arguments", () => {
    let debugFn: (...args: any[]) => void = () => {};
    const mongoose = {
      set: vi.fn((_key: string, fn: (...args: any[]) => void) => {
        debugFn = fn;
      }),
    };

    attachMongooseLens(mongoose as any);
    debugFn("users", "countDocuments");

    expect(watcherEmitter.emit).toHaveBeenCalledWith(
      "mongooseQuery",
      expect.objectContaining({ query: "users.countDocuments()" }),
    );
  });
});

describe("createMongooseHandler", () => {
  let onQueryMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    onQueryMock = vi.fn();
  });

  it("registers a listener on watcherEmitter for mongooseQuery", async () => {
    const handler = createMongooseHandler();
    await handler({ onQuery: onQueryMock });

    expect(watcherEmitter.on).toHaveBeenCalledWith(
      "mongooseQuery",
      expect.any(Function),
    );
  });

  it("calls onQuery with type mongodb and a 0 ms duration", async () => {
    const handler = createMongooseHandler();
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
    await listener({ query: "users.find({})", requestId: "req-9" });

    expect(onQueryMock).toHaveBeenCalledWith(
      {
        query: "users.find({})",
        duration: "0 ms",
        createdAt: "2025-09-18T12:00:00.000Z",
        type: "mongodb",
      },
      "req-9",
    );
  });

  it("falls back to the async-context request id", async () => {
    const handler = createMongooseHandler();
    await handler({ onQuery: onQueryMock });

    const listener = (watcherEmitter.on as Mock).mock.calls[0]![1];
    await listener({ query: "users.find({})" });

    expect(onQueryMock).toHaveBeenCalledWith(
      expect.any(Object),
      "test-request-id",
    );
  });
});
