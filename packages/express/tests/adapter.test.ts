import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { ExpressAdapter } from "../src/adapter.js";
import { Express, Request, Response as ExpressResponse } from "express";
import {
  LensAdapter,
  lensUtils,
  RequestWatcher,
  WatcherTypeEnum,
  QueryWatcher,
  CacheWatcher,
  lensContext,
  lensEmitter,
} from "@lensjs/core";
import fs from "node:fs";
import express from "express";

// Mock external dependencies
vi.mock("@lensjs/core", async (importOriginal) => {
  const original = await importOriginal<typeof import("@lensjs/core")>();
  return {
    ...original,
    lensUtils: {
      ...original.lensUtils,
      shouldIgnoreCurrentPath: vi.fn(),
      generateRandomUuid: vi.fn(() => "mock-uuid"),
      prettyHrTime: vi.fn(() => "100ms"),
      isStaticFile: vi.fn(() => false),
      stripBeforeAssetsPath: vi.fn((p) => p),
    },
    lensContext: {
      run: vi.fn((context, cb) => cb()),
      getStore: vi.fn(() => ({ requestId: "mock-context-req-id" })),
    },
    lensEmitter: {
      on: vi.fn(),
      emit: vi.fn(),
    },
  };
});

vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:path")>();
  return {
    ...actual,
    join: vi.fn((...args) => args.join("/")),
    resolve: vi.fn((p) => p),
  };
});

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(() => false),
  },
}));

vi.mock("express", async (importOriginal) => {
  const actual = await importOriginal<typeof import("express")>();
  const MockResponse = vi.fn(function () {
    this.json = vi.fn();
    this.send = vi.fn();
  });
  return {
    ...actual,
    default: {
      static: vi.fn(() => vi.fn()),
    },
    Response: MockResponse,
  };
});

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(() => "2025-01-01T00:00:00.000Z"),
}));

describe("ExpressAdapter", () => {
  let mockApp: Express;
  let adapter: ExpressAdapter;
  let mockRequestWatcher: RequestWatcher;
  let mockQueryWatcher: QueryWatcher;
  let mockCacheWatcher: CacheWatcher;

  beforeEach(() => {
    mockApp = {
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as Express;

    adapter = new ExpressAdapter({ app: mockApp });

    mockRequestWatcher = {
      name: WatcherTypeEnum.REQUEST,
      log: vi.fn(),
    } as unknown as RequestWatcher;

    mockQueryWatcher = {
      name: WatcherTypeEnum.QUERY,
      log: vi.fn(),
    } as unknown as QueryWatcher;

    mockCacheWatcher = {
      name: WatcherTypeEnum.CACHE,
      log: vi.fn(),
    } as unknown as CacheWatcher;

    vi.clearAllMocks();
    vi.spyOn(adapter, "shouldIgnorePath").mockReturnValue(false);
  });

  it("should extend LensAdapter", () => {
    expect(adapter).toBeInstanceOf(LensAdapter);
  });

  describe("setConfig", () => {
    it("should set the configuration", () => {
      const config = {
        requestWatcherEnabled: true,
        queryWatcher: { enabled: true, handler: vi.fn() },
        cacheWatcherEnabled: true,
        isAuthenticated: vi.fn(),
        getUser: vi.fn(),
      };
      adapter.setConfig(config);
      expect((adapter as any).config).toEqual(config);
    });
  });

  describe("setup", () => {
    it("should call watchRequests if requestWatcher is present and enabled", () => {
      const watchRequestsSpy = vi.spyOn(adapter as any, "watchRequests");
      adapter.setWatchers([mockRequestWatcher]);
      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });
      adapter.setup();
      expect(watchRequestsSpy).toHaveBeenCalledWith(mockRequestWatcher);
    });

    it("should call watchQueries if queryWatcher is present and enabled", () => {
      const watchQueriesSpy = vi.spyOn(adapter as any, "watchQueries");
      adapter.setWatchers([mockQueryWatcher]);
      adapter.setConfig({
        requestWatcherEnabled: false,
        queryWatcher: { enabled: true, handler: vi.fn() },
        cacheWatcherEnabled: false,
      });
      adapter.setup();
      expect(watchQueriesSpy).toHaveBeenCalledWith(mockQueryWatcher);
    });

    it("should call watchCache if cacheWatcher is present and enabled", () => {
      const watchCacheSpy = vi.spyOn(adapter as any, "watchCache");
      adapter.setWatchers([mockCacheWatcher]);
      adapter.setConfig({
        requestWatcherEnabled: false,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: true,
      });
      adapter.setup();
      expect(watchCacheSpy).toHaveBeenCalledWith(mockCacheWatcher);
    });

    it("should not call watchers if not enabled", () => {
      const watchRequestsSpy = vi.spyOn(adapter as any, "watchRequests");
      const watchQueriesSpy = vi.spyOn(adapter as any, "watchQueries");
      const watchCacheSpy = vi.spyOn(adapter as any, "watchCache");

      adapter.setWatchers([
        mockRequestWatcher,
        mockQueryWatcher,
        mockCacheWatcher,
      ]);
      adapter.setConfig({
        requestWatcherEnabled: false,
        queryWatcher: { enabled: false, handler: vi.fn() },
        cacheWatcherEnabled: false,
      });
      adapter.setup();

      expect(watchRequestsSpy).not.toHaveBeenCalled();
      expect(watchQueriesSpy).not.toHaveBeenCalled();
      expect(watchCacheSpy).not.toHaveBeenCalled();
    });
  });

  describe("registerRoutes", () => {
    it("should register GET routes correctly", () => {
      const routes = [{ method: "GET", path: "/test", handler: vi.fn() }];
      adapter.registerRoutes(routes);
      expect(mockApp.get).toHaveBeenCalledWith("/test", expect.any(Function));
    });

    it("should handle route handler execution and response", async () => {
      const mockHandler = vi.fn().mockResolvedValue({
        status: 200,
        message: "OK",
        data: { foo: "bar" },
      });
      const routes = [{ method: "GET", path: "/test", handler: mockHandler }];
      adapter.registerRoutes(routes);

      const req = { params: {}, query: {} } as Request;
      const res = { json: vi.fn() } as unknown as ExpressResponse;

      // Extract the registered handler function
      const registeredHandler = (mockApp.get as Mock).mock.calls[0][1];
      await registeredHandler(req, res);

      expect(mockHandler).toHaveBeenCalledWith({ params: {}, qs: {} });
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "OK",
        data: { foo: "bar" },
      });
    });
  });

  describe("serveUI", () => {
    it("should serve static UI assets", () => {
      adapter.serveUI("/path/to/ui", "/lens", {});
      expect(mockApp.use).toHaveBeenCalledWith("/lens", expect.any(Function));
      expect(express.static).toHaveBeenCalledWith("/path/to/ui");
    });

    it("should serve favicon.ico", () => {
      adapter.serveUI("/path/to/ui", "/lens", {});
      expect(mockApp.get).toHaveBeenCalledWith(
        "/lens/favicon.ico",
        expect.any(Function),
      );

      const req = {} as Request;
      const res = { sendFile: vi.fn() } as unknown as ExpressResponse;
      const faviconHandler = (mockApp.get as Mock).mock.calls[0][1];
      faviconHandler(req, res);
      expect(res.sendFile).toHaveBeenCalledWith("/path/to/ui/favicon.ico");
    });

    it("should serve index.html for SPA routes", () => {
      adapter.serveUI("/path/to/ui", "/lens", {});
      expect(mockApp.get).toHaveBeenCalledWith(
        expect.any(RegExp),
        expect.any(Function),
      );

      const req = { path: "/lens/some/route" } as Request;
      const res = {
        sendFile: vi.fn(),
        download: vi.fn(),
      } as unknown as Response;
      const spaRouteHandler = (mockApp.get as Mock).mock.calls[1][1];

      // Mock isStaticFile to return false for SPA route
      (lensUtils.isStaticFile as Mock).mockReturnValue(false);

      spaRouteHandler(req, res);
      expect(res.sendFile).toHaveBeenCalledWith("/path/to/ui/index.html");
      expect(res.download).not.toHaveBeenCalled();
    });

    it("should download static files if isStaticFile returns true", () => {
      adapter.serveUI("/path/to/ui", "/lens", {});
      expect(mockApp.get).toHaveBeenCalledWith(
        expect.any(RegExp),
        expect.any(Function),
      );

      const req = { path: "/lens/assets/image.png" } as Request;
      const res = {
        sendFile: vi.fn(),
        download: vi.fn(),
      } as unknown as Response;
      const spaRouteHandler = (mockApp.get as Mock).mock.calls[1][1];

      // Mock isStaticFile to return true for static file
      (lensUtils.isStaticFile as Mock).mockReturnValue(true);
      (lensUtils.stripBeforeAssetsPath as Mock).mockReturnValue(
        "assets/image.png",
      );

      spaRouteHandler(req, res);
      expect(res.download).toHaveBeenCalledWith("/path/to/ui/assets/image.png");
      expect(res.sendFile).not.toHaveBeenCalled();
    });
  });

  describe("watchCache", () => {
    it("should register an event listener for cache events if enabled", () => {
      adapter.setConfig({
        cacheWatcherEnabled: true,
        queryWatcher: { enabled: false },
        requestWatcherEnabled: false,
      });
      adapter.setWatchers([mockCacheWatcher]);
      (adapter as any).watchCache(mockCacheWatcher);
      expect(lensEmitter.on).toHaveBeenCalledWith(
        "cache",
        expect.any(Function),
      );
    });

    it("should not register an event listener if disabled", () => {
      adapter.setConfig({
        cacheWatcherEnabled: false,
        queryWatcher: { enabled: false },
        requestWatcherEnabled: false,
      });
      adapter.setWatchers([mockCacheWatcher]);
      (adapter as any).watchCache(mockCacheWatcher);
      expect(lensEmitter.on).not.toHaveBeenCalled();
    });

    it("should call watcher.log when a cache event is emitted", async () => {
      adapter.setConfig({
        cacheWatcherEnabled: true,
        queryWatcher: { enabled: false },
        requestWatcherEnabled: false,
      });
      adapter.setWatchers([mockCacheWatcher]);
      (adapter as any).watchCache(mockCacheWatcher);

      const cacheEventHandler = (lensEmitter.on as Mock).mock.calls[0][1];
      const mockCacheData = { action: "SET", key: "test", value: "data" };
      await cacheEventHandler(mockCacheData);

      expect(mockCacheWatcher.log).toHaveBeenCalledWith(mockCacheData);
    });
  });

  describe("watchQueries", () => {
    it("should call the query handler if enabled", async () => {
      const mockQueryHandler = vi.fn(async ({ onQuery }) => {
        await onQuery({
          query: "SELECT 1",
          duration: "1ms",
          createdAt: "now",
          type: "sql",
        });
      });
      adapter.setConfig({
        queryWatcher: { enabled: true, handler: mockQueryHandler },
        requestWatcherEnabled: false,
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockQueryWatcher]);
      await (adapter as any).watchQueries(mockQueryWatcher);

      expect(mockQueryHandler).toHaveBeenCalled();
      expect(mockQueryWatcher.log).toHaveBeenCalledWith({
        data: {
          query: "SELECT 1",
          duration: "1ms",
          createdAt: "now",
          type: "sql",
        },
        requestId: "mock-context-req-id",
      });
    });

    it("should not call the query handler if disabled", async () => {
      const mockQueryHandler = vi.fn();
      adapter.setConfig({
        queryWatcher: { enabled: false, handler: mockQueryHandler },
        requestWatcherEnabled: false,
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockQueryWatcher]);
      await (adapter as any).watchQueries(mockQueryWatcher);

      expect(mockQueryHandler).not.toHaveBeenCalled();
      expect(mockQueryWatcher.log).not.toHaveBeenCalled();
    });
  });

  describe("watchRequests", () => {
    it("should register a middleware for request watching if enabled", () => {
      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockRequestWatcher]);
      (adapter as any).watchRequests(mockRequestWatcher);

      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not register a middleware if disabled", () => {
      adapter.setConfig({
        requestWatcherEnabled: false,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockRequestWatcher]);
      (adapter as any).watchRequests(mockRequestWatcher);

      expect(mockApp.use).not.toHaveBeenCalled();
    });

    it("should skip logging if path is ignored", async () => {
      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockRequestWatcher]);
      (adapter as any).watchRequests(mockRequestWatcher);

      const middleware = (mockApp.use as Mock).mock.calls[0][0];
      const req = { path: "/ignored" } as Request;
      const res = { on: vi.fn() } as unknown as Response;
      const next = vi.fn();

      vi.spyOn(adapter, "shouldIgnorePath").mockReturnValue(true);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(lensContext.run).not.toHaveBeenCalled();
    });

    it("should patch response methods and finalize log on finish", async () => {
      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });
      adapter.setWatchers([mockRequestWatcher]);
      (adapter as any).watchRequests(mockRequestWatcher);

      const middleware = (mockApp.use as Mock).mock.calls[0][0];
      const req = {
        originalUrl: "/test",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        on: vi.fn(),
        json: vi.fn(),
        send: vi.fn(),
        getHeaders: vi.fn(() => ({})),
      } as unknown as Response;
      const next = vi.fn();

      const patchResponseMethodsSpy = vi.spyOn(
        adapter as any,
        "patchResponseMethods",
      );
      const finalizeRequestLogSpy = vi.spyOn(
        adapter as any,
        "finalizeRequestLog",
      );

      middleware(req, res, next);

      expect(lensContext.run).toHaveBeenCalled();
      expect(patchResponseMethodsSpy).toHaveBeenCalledWith(res);
      expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
      expect(next).toHaveBeenCalled();

      // Simulate the 'finish' event
      const finishHandler = (res.on as Mock).mock.calls[0][1];
      await finishHandler();

      expect(finalizeRequestLogSpy).toHaveBeenCalledWith(
        req,
        res,
        mockRequestWatcher,
        expect.any(Array),
      );
    });
  });

  describe("patchResponseMethods", () => {
    let mockOriginalJson: Mock;
    let mockOriginalSend: Mock;
    let mockRes: ExpressResponse;

    beforeEach(() => {
      mockOriginalJson = vi.fn();
      mockOriginalSend = vi.fn();

      mockRes = {
        json: mockOriginalJson,
        send: mockOriginalSend,
        on: vi.fn(),
        getHeaders: vi.fn(() => ({})),
        statusCode: 200,
      } as unknown as ExpressResponse;
    });

    it("should patch res.json to capture body and call original json", () => {
      (adapter as any).patchResponseMethods(mockRes);

      const testBody = { message: "hello" };
      mockRes.json(testBody);

      expect((mockRes as any)._body).toEqual(testBody);
      expect(mockOriginalJson).toHaveBeenCalledWith(testBody);
    });

    it("should patch res.send to capture and sanitize body", () => {
      (adapter as any).patchResponseMethods(mockRes);

      // Test with JSON object (should not be purged)
      const jsonBody = { data: "some data" };
      mockRes.send(jsonBody);
      expect((mockRes as any)._body).toEqual(jsonBody);
      expect(mockOriginalSend).toHaveBeenCalledWith(jsonBody);
      mockOriginalSend.mockClear();

      // Test with string (not a file path, should not be purged)
      const stringBody = "plain text";
      mockRes.send(stringBody);
      expect((mockRes as any)._body).toEqual(stringBody);
      expect(mockOriginalSend).toHaveBeenCalledWith(stringBody);
      mockOriginalSend.mockClear();

      // Test with Buffer (should be purged)
      const bufferBody = Buffer.from("binary data");
      mockRes.send(bufferBody);
      expect((mockRes as any)._body).toBe("Purged By Lens");
      expect(mockOriginalSend).toHaveBeenCalledWith("Purged By Lens");
      mockOriginalSend.mockClear();

      // Test with file path (should be purged)
      (fs.existsSync as Mock).mockReturnValue(true);
      const filePathBody = "/path/to/secret.txt";
      mockRes.send(filePathBody);
      expect((mockRes as any)._body).toBe("Purged By Lens");
      expect(mockOriginalSend).toHaveBeenCalledWith("Purged By Lens");
      mockOriginalSend.mockClear();

      // Test with null/undefined body (should be purged)
      mockRes.send(null);
      expect((mockRes as any)._body).toBe("Purged By Lens");
      expect(mockOriginalSend).toHaveBeenCalledWith("Purged By Lens");
      mockOriginalSend.mockClear();
    });
  });

  describe("finalizeRequestLog", () => {
    let consoleErrorSpy: vi.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should log request details with user info if authenticated", async () => {
      const req = {
        originalUrl: "/final",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: { result: "ok" },
        getHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
      } as unknown as Response;
      const start: [number, number] = [0, 0];

      const mockIsAuthenticated = vi.fn(() => Promise.resolve(true));
      const mockGetUser = vi.fn(() =>
        Promise.resolve({ id: "user-final", name: "Final User" }),
      );

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
        isAuthenticated: mockIsAuthenticated,
        getUser: mockGetUser,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockIsAuthenticated).toHaveBeenCalledWith(req);
      expect(mockGetUser).toHaveBeenCalledWith(req);
      expect(mockRequestWatcher.log).toHaveBeenCalledWith({
        request: expect.objectContaining({
          id: "mock-context-req-id",
          method: "GET",
          duration: "100ms",
          path: "/final",
          status: 200,
          ip: "127.0.0.1",
          createdAt: "2025-01-01T00:00:00.000Z",
        }),
        response: {
          json: { result: "ok" },
          headers: { "Content-Type": "application/json" },
        },
        user: { id: "user-final", name: "Final User" },
      });
    });

    it("should log request details without user info if not authenticated", async () => {
      const req = {
        originalUrl: "/final",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: { result: "ok" },
        getHeaders: vi.fn(() => ({})),
      } as unknown as Response;
      const start: [number, number] = [0, 0];

      const mockIsAuthenticated = vi.fn(() => Promise.resolve(false));
      const mockGetUser = vi.fn(); // Should not be called

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
        isAuthenticated: mockIsAuthenticated,
        getUser: mockGetUser,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockIsAuthenticated).toHaveBeenCalledWith(req);
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user: null,
        }),
      );
    });

    it("should handle errors during logging gracefully", async () => {
      const req = {
        originalUrl: "/error",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 500,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as Response;
      const start: [number, number] = [0, 0];

      mockRequestWatcher.log.mockRejectedValue(new Error("Log save failed"));

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finalizing request log:",
        expect.any(Error),
      );
    });

    it("should use requestId from lensContext if available", async () => {
      const req = {
        originalUrl: "/context-id",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as ExpressResponse;
      const start: [number, number] = [0, 0];

      (lensContext.getStore as Mock).mockReturnValue({
        requestId: "context-specific-id",
      });

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            id: "context-specific-id",
          }),
        }),
      );
    });

    it("should generate new requestId if not in context", async () => {
      const req = {
        originalUrl: "/no-context-id",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as ExpressResponse;
      const start: [number, number] = [0, 0];

      (lensContext.getStore as Mock).mockReturnValue(null); // Simulate no context store
      (lensUtils.generateRandomUuid as Mock).mockReturnValueOnce(
        "new-generated-uuid",
      );

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(lensUtils.generateRandomUuid).toHaveBeenCalled();
      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            id: "new-generated-uuid",
          }),
        }),
      );
    });

    it("should handle undefined req.body and req.socket.remoteAddress gracefully", async () => {
      const req = {
        originalUrl: "/no-body-ip",
        method: "POST",
        headers: {},
      } as Request;
      const res = {
        statusCode: 200,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as ExpressResponse;
      const start: [number, number] = [0, 0];

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            body: {},
            ip: "",
          }),
        }),
      );
    });

    it("should log error if isAuthenticated throws", async () => {
      const req = {
        originalUrl: "/auth-error",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as ExpressResponse;
      const start: [number, number] = [0, 0];

      const mockIsAuthenticated = vi.fn(() =>
        Promise.reject(new Error("Auth check failed")),
      );

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
        isAuthenticated: mockIsAuthenticated,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockIsAuthenticated).toHaveBeenCalledWith(req);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finalizing request log:",
        expect.any(Error),
      );
      expect(mockRequestWatcher.log).not.toHaveBeenCalled(); // Log should not be called if an error occurs before it
    });

    it("should log error if getUser throws", async () => {
      const req = {
        originalUrl: "/getuser-error",
        method: "GET",
        headers: {},
        body: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as Request;
      const res = {
        statusCode: 200,
        _body: null,
        getHeaders: vi.fn(() => ({})),
      } as unknown as ExpressResponse;
      const start: [number, number] = [0, 0];

      const mockIsAuthenticated = vi.fn(() => Promise.resolve(true));
      const mockGetUser = vi.fn(() =>
        Promise.reject(new Error("Get user failed")),
      );

      adapter.setConfig({
        requestWatcherEnabled: true,
        queryWatcher: { enabled: false },
        cacheWatcherEnabled: false,
        isAuthenticated: mockIsAuthenticated,
        getUser: mockGetUser,
      });

      await (adapter as any).finalizeRequestLog(
        req,
        res,
        mockRequestWatcher,
        start,
      );

      expect(mockIsAuthenticated).toHaveBeenCalledWith(req);
      expect(mockGetUser).toHaveBeenCalledWith(req);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finalizing request log:",
        expect.any(Error),
      );
      expect(mockRequestWatcher.log).not.toHaveBeenCalled(); // Log should not be called if an error occurs before it
    });
  });

  describe("normalizePath", () => {
    it("should add leading slash if missing", () => {
      expect((adapter as any).normalizePath("test")).toBe("/test");
    });

    it("should not add leading slash if present", () => {
      expect((adapter as any).normalizePath("/test")).toBe("/test");
    });
  });

  describe("parseBody", () => {
    it("should parse JSON string", () => {
      expect((adapter as any).parseBody('{"foo":"bar"}')).toEqual({
        foo: "bar",
      });
    });

    it("should return original body if not JSON string", () => {
      expect((adapter as any).parseBody("plain text")).toBe("plain text");
    });

    it("should return null if body is null", () => {
      expect((adapter as any).parseBody(null)).toBeNull();
    });

    it("should return original body if parsing fails", () => {
      expect((adapter as any).parseBody("{invalid json")).toBe("{invalid json");
    });
  });
});
