import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Lens,
  RequestWatcher,
  CacheWatcher,
  QueryWatcher,
  ExceptionWatcher,
  lensContext,
  lensExceptionUtils,
} from "@lensjs/core";
import { lens, handleExceptions } from "../src";

vi.mock("../src/adapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/adapter")>();
  const mockHonoAdapterInstance = {
    setConfig: vi.fn().mockReturnThis(),
    setIgnoredPaths: vi.fn().mockReturnThis(),
    setOnlyPaths: vi.fn().mockReturnThis(),
    setup: vi.fn(),
    registerRoutes: vi.fn(),
    serveUI: vi.fn(),
  };
  return {
    ...actual,
    HonoAdapter: vi.fn(() => mockHonoAdapterInstance),
  };
});

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
      this.log = vi.fn();
    }),
    QueryWatcher: vi.fn(function (this: any) {
      this.name = "query";
      this.log = vi.fn();
    }),
    ExceptionWatcher: vi.fn(function (this: any) {
      this.name = "exception";
      this.log = vi.fn();
    }),
    lensUtils: {
      ...actual.lensUtils,
      prepareIgnoredPaths: vi.fn().mockReturnValue({
        ignoredPaths: ["/health"],
        normalizedPath: "/lens",
      }),
    },
    lensContext: {
      ...actual.lensContext,
      getStore: vi.fn(),
    },
    lensExceptionUtils: {
      ...actual.lensExceptionUtils,
      constructErrorObject: vi.fn((err: Error) => ({
        name: err.name,
        message: err.message,
        createdAt: "mock-date",
        fileInfo: { file: "", function: "" },
        trace: [],
        codeFrame: null,
        originalStack: null,
      })),
    },
    handleUncaughExceptions: vi.fn(),
  };
});

describe("lens()", () => {
  let mockApp: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = { use: vi.fn(), on: vi.fn(), get: vi.fn(), onError: vi.fn() };
  });

  it("merges config and starts Lens with defaults", async () => {
    await lens({ app: mockApp });

    expect(Lens.setAdapter).toHaveBeenCalled();
    expect(Lens.setWatchers).toHaveBeenCalledWith([
      expect.any(RequestWatcher),
      expect.any(ExceptionWatcher),
    ]);
    expect(Lens.start).toHaveBeenCalledWith({
      appName: "Lens",
      enabled: true,
      path: "/lens",
      authEnabled: false,
      alerts: undefined,
    });
  });

  it("registers a global onError by default", async () => {
    await lens({ app: mockApp });
    expect(mockApp.onError).toHaveBeenCalledWith(expect.any(Function));
  });

  it("does not register onError when registerErrorHandler is false", async () => {
    await lens({ app: mockApp, registerErrorHandler: false });
    expect(mockApp.onError).not.toHaveBeenCalled();
  });

  it("enables the cache watcher when configured", async () => {
    await lens({ app: mockApp, cacheWatcherEnabled: true });
    expect(CacheWatcher).toHaveBeenCalled();
  });

  it("enables the query watcher when queryWatcher.enabled is true", async () => {
    await lens({
      app: mockApp,
      queryWatcher: { enabled: true, handler: vi.fn() },
    });
    expect(QueryWatcher).toHaveBeenCalled();
  });
});

describe("handleExceptions", () => {
  let mockApp: any;
  let mockExceptionWatcher: ExceptionWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = { onError: vi.fn() };
    mockExceptionWatcher = new ExceptionWatcher();
    vi.mocked(lensContext.getStore).mockReturnValue(undefined);
  });

  it("registers an onError handler when enabled and a watcher is provided", () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });
    expect(mockApp.onError).toHaveBeenCalledTimes(1);
    expect(mockApp.onError.mock.calls[0][0]).toBeInstanceOf(Function);
  });

  it("does not register an onError handler when disabled", () => {
    handleExceptions({
      app: mockApp,
      enabled: false,
      watcher: mockExceptionWatcher,
    });
    expect(mockApp.onError).not.toHaveBeenCalled();
  });

  it("logs the exception and returns a 500 for a generic error", () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });

    const onError = mockApp.onError.mock.calls[0][0];
    const error = new Error("boom");
    const c = { text: vi.fn((msg: string, status: number) => ({ msg, status })) };

    const result = onError(error, c);

    expect(lensExceptionUtils.constructErrorObject).toHaveBeenCalledWith(error);
    expect(mockExceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Error", message: "boom" }),
    );
    expect(c.text).toHaveBeenCalledWith("Internal Server Error", 500);
    expect(result).toEqual({ msg: "Internal Server Error", status: 500 });
  });

  it("includes the requestId from lensContext when available", () => {
    vi.mocked(lensContext.getStore).mockReturnValue({ requestId: "abc" });
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });
    const onError = mockApp.onError.mock.calls[0][0];
    onError(new Error("x"), {
      text: vi.fn(() => ({})),
    });
    expect(mockExceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "abc" }),
    );
  });
});
