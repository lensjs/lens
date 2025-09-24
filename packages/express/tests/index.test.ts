import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpressAdapter } from "../src/adapter";
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
import { Application, Request, Response, NextFunction } from "express";

vi.mock("../src/adapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/adapter")>();
  const mockExpressAdapterInstance = {
    setConfig: vi.fn().mockReturnThis(),
    setIgnoredPaths: vi.fn().mockReturnThis(),
    setOnlyPaths: vi.fn().mockReturnThis(),
    setup: vi.fn(),
    registerRoutes: vi.fn(),
    serveUI: vi.fn(),
  };
  return {
    ...actual,
    ExpressAdapter: vi.fn(() => mockExpressAdapterInstance),
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
    RequestWatcher: vi.fn(function () {
      this.name = "request";
      this.log = vi.fn();
    }),
    CacheWatcher: vi.fn(function () {
      this.name = "cache";
      this.log = vi.fn();
    }),
    QueryWatcher: vi.fn(function () {
      this.name = "query";
      this.log = vi.fn();
    }),
    ExceptionWatcher: vi.fn(function () {
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
    lensEmitter: { emit: vi.fn() },
    lensContext: {
      ...actual.lensContext,
      getStore: vi.fn(),
    },
    lensExceptionUtils: {
      ...actual.lensExceptionUtils,
      constructErrorObject: vi.fn((err) => ({
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
    mockApp = { use: vi.fn() };
  });

  it("merges config and starts Lens with defaults", async () => {
    await lens({ app: mockApp });

    expect(ExpressAdapter).toHaveBeenCalledWith({ app: mockApp });
    expect(Lens.setAdapter).toHaveBeenCalled();
    expect(Lens.setWatchers).toHaveBeenCalledWith([
      expect.any(RequestWatcher),
      expect.any(ExceptionWatcher),
    ]);
    expect(Lens.start).toHaveBeenCalledWith({
      appName: "Lens",
      enabled: true,
      basePath: "/lens",
    });
  });

  it("enables cache watcher when configured", async () => {
    await lens({ app: mockApp, cacheWatcherEnabled: true });

    // CacheWatcher should be instantiated
    expect(CacheWatcher).toHaveBeenCalled();
  });

  it("enables query watcher if queryWatcher.enabled = true", async () => {
    await lens({
      app: mockApp,
      queryWatcher: {
        enabled: true,
        handler: vi.fn(),
      },
    });

    expect(QueryWatcher).toHaveBeenCalled();
  });
});

describe("handleExceptions", () => {
  let mockApp: Application;
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let mockExceptionWatcher: ExceptionWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = { use: vi.fn() } as unknown as Application;
    mockRequest = {} as Request;
    mockResponse = {} as Response;
    mockNext = vi.fn() as NextFunction;
    mockExceptionWatcher = new ExceptionWatcher();
    vi.mocked(lensContext.getStore).mockReturnValue(undefined);
  });

  it("should register an error handling middleware when enabled and watcher is provided", () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });

    expect(mockApp.use).toHaveBeenCalledTimes(1);
    const errorHandler = mockApp.use.mock.calls[0][0];
    expect(errorHandler).toBeInstanceOf(Function);
    expect(errorHandler.length).toBe(4); // Express error middleware has 4 arguments
  });

  it("should not register an error handling middleware when disabled", () => {
    handleExceptions({
      app: mockApp,
      enabled: false,
      watcher: mockExceptionWatcher,
    });

    expect(mockApp.use).not.toHaveBeenCalled();
  });

  it("should not register an error handling middleware when no watcher is provided", () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: undefined,
    });

    expect(mockApp.use).not.toHaveBeenCalled();
  });

  it("should log the exception and call next with the error", async () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });

    const errorHandler = mockApp.use.mock.calls[0][0];
    const error = new Error("Test Express Error");

    await errorHandler(error, mockRequest, mockResponse, mockNext);

    expect(lensExceptionUtils.constructErrorObject).toHaveBeenCalledWith(error);
    expect(mockExceptionWatcher.log).toHaveBeenCalledWith({
      name: "Error",
      message: "Test Express Error",
      createdAt: "mock-date",
      fileInfo: { file: "", function: "" },
      trace: [],
      codeFrame: null,
      originalStack: null,
      requestId: undefined,
    });
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should include requestId from lensContext if available", async () => {
    handleExceptions({
      app: mockApp,
      enabled: true,
      watcher: mockExceptionWatcher,
    });

    const errorHandler = mockApp.use.mock.calls[0][0];
    const error = new Error("Test Express Error with RequestId");
    const requestId = "express-request-id";

    vi.mocked(lensContext.getStore).mockReturnValue({ requestId });

    await errorHandler(error, mockRequest, mockResponse, mockNext);

    expect(mockExceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: requestId,
      }),
    );
  });
});
