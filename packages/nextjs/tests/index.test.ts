import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Lens,
  RequestWatcher,
  ExceptionWatcher,
  QueryWatcher,
} from "@lensjs/core";
import { createLens } from "../src";

vi.mock("../src/adapter", () => ({
  NextAdapter: vi.fn(() => ({
    setConfig: vi.fn().mockReturnThis(),
    setIgnoredPaths: vi.fn().mockReturnThis(),
    setOnlyPaths: vi.fn().mockReturnThis(),
    setup: vi.fn(),
    registerRoutes: vi.fn(),
    serveUI: vi.fn(),
    dispatch: vi.fn(),
    shouldIgnorePath: vi.fn(() => false),
  })),
}));

vi.mock("@lensjs/core", async () => {
  const actual =
    await vi.importActual<typeof import("@lensjs/core")>("@lensjs/core");
  return {
    ...actual,
    Lens: {
      setAdapter: vi.fn().mockReturnThis(),
      setWatchers: vi.fn().mockReturnThis(),
      start: vi.fn().mockResolvedValue(undefined),
    },
    RequestWatcher: vi.fn(function (this: any) {
      this.name = "request";
      this.log = vi.fn();
    }),
    CacheWatcher: vi.fn(function (this: any) {
      this.name = "cache";
    }),
    QueryWatcher: vi.fn(function (this: any) {
      this.name = "query";
    }),
    ExceptionWatcher: vi.fn(function (this: any) {
      this.name = "exception";
      this.log = vi.fn();
    }),
    MailWatcher: vi.fn(function (this: any) {
      this.name = "mail";
    }),
    HttpWatcher: vi.fn(function (this: any) {
      this.name = "http";
    }),
    EventWatcher: vi.fn(function (this: any) {
      this.name = "event";
    }),
    RedisWatcher: vi.fn(function (this: any) {
      this.name = "redis";
    }),
    FcmWatcher: vi.fn(function (this: any) {
      this.name = "fcm";
    }),
    LogWatcher: vi.fn(function (this: any) {
      this.name = "log";
    }),
    JobWatcher: vi.fn(function (this: any) {
      this.name = "job";
    }),
    lensUtils: {
      ...actual.lensUtils,
      prepareIgnoredPaths: vi.fn(() => ({
        ignoredPaths: [],
        normalizedPath: "lens",
      })),
    },
    handleUncaughExceptions: vi.fn(),
  };
});

describe("createLens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts Lens with defaults and returns handlers + withLens + lensMiddleware", async () => {
    const result = await createLens();

    expect(Lens.setAdapter).toHaveBeenCalled();
    expect(Lens.setWatchers).toHaveBeenCalledWith([
      expect.any(RequestWatcher),
      expect.any(ExceptionWatcher),
    ]);
    expect(Lens.start).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: "Lens",
        enabled: true,
        path: "lens",
        authEnabled: false,
      }),
    );

    expect(result.handlers).toHaveProperty("GET");
    expect(result.handlers).toHaveProperty("POST");
    expect(result.handlers).toHaveProperty("DELETE");
    expect(typeof result.withLens).toBe("function");
    expect(typeof result.lensMiddleware).toBe("function");
  });

  it("enables the query watcher when configured", async () => {
    await createLens({ queryWatcher: { enabled: true, handler: vi.fn() } });
    expect(QueryWatcher).toHaveBeenCalled();
  });

  it("returns no-op handlers and an identity withLens when disabled", async () => {
    const result = await createLens({ enabled: false });

    expect(Lens.start).not.toHaveBeenCalled();

    const res = await result.handlers.GET(new Request("http://localhost/lens"));
    expect(res.status).toBe(404);

    const original = async () => new Response("x");
    expect(result.withLens(original)).toBe(original);
  });
});
