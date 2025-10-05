import { describe, it, expect, vi, beforeEach } from "vitest";
import { FastifyAdapter } from "../src/adapter";
import {
  CacheWatcher,
  ExceptionWatcher,
  lensContext,
  lensEmitter,
  lensUtils,
  QueryWatcher,
  RequestWatcher,
  WatcherTypeEnum,
} from "@lensjs/core";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static"; // Explicitly import fastifyStatic
import * as path from "node:path";
import * as fs from "node:fs";
import { nowISO } from "@lensjs/date";

// Mock external dependencies
vi.mock("@lensjs/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lensjs/core")>();
  return {
    ...actual,
    lensContext: {
      ...actual.lensContext,
      getStore: vi.fn(() => ({ requestId: "mock-request-id" })),
      run: vi.fn((_context, cb) => cb()),
    },
    lensEmitter: {
      ...actual.lensEmitter,
      on: vi.fn(),
      emit: vi.fn(),
    },
    lensUtils: {
      ...actual.lensUtils,
      generateRandomUuid: vi.fn(() => "mock-uuid"),
      prettyHrTime: vi.fn(() => "1ms"),
      normalizePath: vi.fn((p) => (p.startsWith("/") ? p : `/${p}`)),
      prepareIgnoredPaths: vi.fn((path, ignored) => ({
        ignoredPaths: ignored,
        normalizedPath: path,
      })),
      isStaticFile: vi.fn(() => false),
      stripBeforeAssetsPath: vi.fn((url) => url),
    },
    RequestWatcher: vi.fn(() => ({
      name: WatcherTypeEnum.REQUEST,
      log: vi.fn(),
    })),
    CacheWatcher: vi.fn(() => ({ name: WatcherTypeEnum.CACHE, log: vi.fn() })),
    QueryWatcher: vi.fn(() => ({ name: WatcherTypeEnum.QUERY, log: vi.fn() })),
    ExceptionWatcher: vi.fn(() => ({
      name: WatcherTypeEnum.EXCEPTION,
      log: vi.fn(),
    })),
  };
});

// Correctly mock the default export of @fastify/static as an object
vi.mock("@fastify/static", () => ({
  default: vi.fn(),
}));

vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:path")>();
  return {
    ...actual,
    join: vi.fn((...args) => args.join("/")),
    resolve: vi.fn((p) => p),
    relative: vi.fn((from, to) => to.replace(from, "")),
  };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
  };
});

vi.mock("@lensjs/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lensjs/date")>();
  return {
    ...actual,
    nowISO: vi.fn(() => "2023-10-27T10:00:00.000Z"),
  };
});

// Mock Fastify instance
const mockFastifyInstance = {
  addHook: vi.fn(),
  route: vi.fn(),
  register: vi.fn(),
  get: vi.fn(),
  setErrorHandler: vi.fn(),
} as unknown as FastifyInstance;

describe("FastifyAdapter", () => {
  let adapter: FastifyAdapter;
  let mockRequestWatcher: RequestWatcher;
  let mockCacheWatcher: CacheWatcher;
  let mockQueryWatcher: QueryWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestWatcher = new RequestWatcher();
    mockCacheWatcher = new CacheWatcher();
    mockQueryWatcher = new QueryWatcher();

    adapter = new FastifyAdapter({ app: mockFastifyInstance });
    adapter.setWatchers([
      mockRequestWatcher,
      mockCacheWatcher,
      mockQueryWatcher,
      new ExceptionWatcher(), // ExceptionWatcher is not directly watched by adapter
    ]);

    // Reset mocks for external dependencies
    lensContext.getStore
      .mockClear()
      .mockReturnValue({ requestId: "mock-request-id" });
    lensContext.run.mockClear().mockImplementation((_context, cb) => cb());
    lensEmitter.on.mockClear();
    lensEmitter.emit.mockClear();
    lensUtils.generateRandomUuid.mockClear().mockReturnValue("mock-uuid");
    lensUtils.prettyHrTime.mockClear().mockReturnValue("1ms");
    lensUtils.normalizePath.mockClear().mockImplementation((p) => p);
    lensUtils.isStaticFile.mockClear().mockReturnValue(false);
    lensUtils.stripBeforeAssetsPath
      .mockClear()
      .mockImplementation((url) => url);
    (fastifyStatic as vi.Mock).mockClear(); // Clear the direct function mock
    (path.join as vi.Mock)
      .mockClear()
      .mockImplementation((...args) => args.join("/"));
    (path.resolve as vi.Mock).mockClear().mockImplementation((p) => p);
    (path.relative as vi.Mock)
      .mockClear()
      .mockImplementation((from, to) => to.replace(from, ""));
    (fs.existsSync as vi.Mock).mockClear().mockReturnValue(false);
    (nowISO as vi.Mock).mockClear().mockReturnValue("2023-10-27T10:00:00.000Z");

    mockFastifyInstance.addHook.mockClear();
    mockFastifyInstance.route.mockClear();
    mockFastifyInstance.register.mockClear();
    mockFastifyInstance.get.mockClear();
    mockFastifyInstance.setErrorHandler.mockClear();

    mockRequestWatcher.log.mockClear();
    mockCacheWatcher.log.mockClear();
    mockQueryWatcher.log.mockClear();
  });

  it("should be an instance of FastifyAdapter", () => {
    expect(adapter).toBeInstanceOf(FastifyAdapter);
  });

  it("should set the app instance in the constructor", () => {
    // The app is set in the constructor, so we just need to ensure it's accessible
    // This is implicitly tested by other methods using `this.app`
    expect((adapter as any).app).toBe(mockFastifyInstance);
  });

  it("should set the config", () => {
    const config = {
      app: mockFastifyInstance,
      appName: "TestApp",
      enabled: true,
    };
    adapter.setConfig(config as any);
    expect((adapter as any).config).toEqual(config);
  });

  it("should set ignored paths", () => {
    const ignored = [/\/ignore\//];
    adapter.setIgnoredPaths(ignored);
    expect((adapter as any).ignoredPaths).toEqual(ignored);
  });

  it("should set only paths", () => {
    const only = [/\/only\//];
    adapter.setOnlyPaths(only);
    expect((adapter as any).onlyPaths).toEqual(only);
  });

  describe("setup", () => {
    it("should call watchRequests if requestWatcherEnabled is true", () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        requestWatcherEnabled: true,
      } as any);
      adapter.setup();
      expect(mockFastifyInstance.addHook).toHaveBeenCalledWith(
        "onRequest",
        expect.any(Function),
      );
      expect(mockFastifyInstance.addHook).toHaveBeenCalledWith(
        "onSend",
        expect.any(Function),
      );
      expect(mockFastifyInstance.addHook).toHaveBeenCalledWith(
        "onResponse",
        expect.any(Function),
      );
    });

    it("should NOT call watchRequests if requestWatcherEnabled is false", () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        requestWatcherEnabled: false,
      } as any);
      adapter.setup();
      expect(mockFastifyInstance.addHook).not.toHaveBeenCalledWith(
        "onRequest",
        expect.any(Function),
      );
      expect(mockFastifyInstance.addHook).not.toHaveBeenCalledWith(
        "onSend",
        expect.any(Function),
      );
      expect(mockFastifyInstance.addHook).not.toHaveBeenCalledWith(
        "onResponse",
        expect.any(Function),
      );
    });

    it("should call watchCache if cacheWatcherEnabled is true", () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        cacheWatcherEnabled: true,
      } as any);
      adapter.setup();
      expect(lensEmitter.on).toHaveBeenCalledWith(
        "cache",
        expect.any(Function),
      );
    });

    it("should NOT call watchCache if cacheWatcherEnabled is false", () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        cacheWatcherEnabled: false,
      } as any);
      adapter.setup();
      expect(lensEmitter.on).not.toHaveBeenCalledWith(
        "cache",
        expect.any(Function),
      );
    });

    it("should call watchQueries if queryWatcher.enabled is true", async () => {
      const mockQueryHandler = vi.fn((opts) => {
        // Simulate onQuery being called by the handler
        opts.onQuery({
          query: "SELECT * FROM users",
          duration: "5ms",
          type: "read",
        });
      });
      adapter.setConfig({
        app: mockFastifyInstance,
        queryWatcher: { enabled: true, handler: mockQueryHandler },
      } as any);
      await adapter.setup(); // setup is async due to watchQueries
      expect(mockQueryHandler).toHaveBeenCalledWith(
        expect.objectContaining({ onQuery: expect.any(Function) }),
      );
    });

    it("should NOT call watchQueries if queryWatcher.enabled is false", async () => {
      const mockQueryHandler = vi.fn();
      adapter.setConfig({
        app: mockFastifyInstance,
        queryWatcher: { enabled: false, handler: mockQueryHandler },
      } as any);
      await adapter.setup();
      expect(mockQueryHandler).not.toHaveBeenCalled();
    });
  });

  describe("registerRoutes", () => {
    it("should register routes with the fastify app", () => {
      const routes = [
        { method: "GET", path: "/test", handler: vi.fn() },
        { method: "POST", path: "/another", handler: vi.fn() },
      ];
      adapter.registerRoutes(routes);

      expect(mockFastifyInstance.route).toHaveBeenCalledTimes(2);
      expect(mockFastifyInstance.route).toHaveBeenCalledWith({
        method: "GET",
        url: "/test",
        handler: expect.any(Function),
      });
      expect(mockFastifyInstance.route).toHaveBeenCalledWith({
        method: "POST",
        url: "/another",
        handler: expect.any(Function),
      });
    });

    it("should normalize route paths", () => {
      const routes = [
        { method: 'GET', path: "test", handler: vi.fn() }, // No leading slash
      ];
      adapter.registerRoutes(routes);

      expect(mockFastifyInstance.route).toHaveBeenCalledWith({
        method: "GET",
        url: "/test",
        handler: expect.any(Function),
      });
    });

    it("should call the route handler with correct parameters", async () => {
      const mockHandler = vi.fn().mockResolvedValue({ data: "test" });
      const routes = [
        { method: 'GET', path: "/test", handler: mockHandler },
      ];
      adapter.registerRoutes(routes);

      const routeOptions = mockFastifyInstance.route.mock.calls[0][0];
      const mockRequest = {
        params: { id: "123" },
        query: { q: "abc" },
      } as unknown as FastifyRequest;
      const mockReply = { send: vi.fn() } as unknown as FastifyReply;

      await routeOptions.handler(mockRequest, mockReply);

      expect(mockHandler).toHaveBeenCalledWith({
        params: { id: "123" },
        qs: { q: "abc" },
      });
      expect(mockReply.send).toHaveBeenCalledWith({ data: "test" });
    });
  });

  describe("serveUI", () => {
    const uiPath = "/path/to/ui";
    const spaRoute = "lens-ui";
    const dataToInject = { key: "value" };

    beforeEach(() => {
      adapter.setConfig({ app: mockFastifyInstance, path: "/lens" } as any);
    });

    it("should register fastify-static with correct root and prefix", () => {
      adapter.serveUI(uiPath, spaRoute, dataToInject);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(fastifyStatic, {
        root: uiPath,
        prefix: "/lens-ui/",
        wildcard: false,
        serve: false,
      });
    });

    it("should register a GET route for the SPA", () => {
      adapter.serveUI(uiPath, spaRoute, dataToInject);
      expect(mockFastifyInstance.get).toHaveBeenCalledWith(
        "/lens-ui/*",
        expect.any(Function),
      );
    });

    it("should serve index.html for non-static SPA routes", async () => {
      lensUtils.isStaticFile.mockReturnValue(false);
      adapter.serveUI(uiPath, spaRoute, dataToInject);

      const getHandler = mockFastifyInstance.get.mock.calls[0][1];
      const mockRequest = { url: "/lens-ui/some/route" } as FastifyRequest;
      const mockReply = { sendFile: vi.fn() } as unknown as FastifyReply;

      await getHandler(mockRequest, mockReply);

      expect(mockReply.sendFile).toHaveBeenCalledWith("index.html", uiPath);
    });

    it("should serve static files for static SPA routes", async () => {
      lensUtils.isStaticFile.mockReturnValue(true);
      lensUtils.stripBeforeAssetsPath.mockReturnValue("assets/image.png");
      (path.relative as vi.Mock).mockReturnValue("assets/image.png");

      adapter.serveUI(uiPath, spaRoute, dataToInject);

      const getHandler = mockFastifyInstance.get.mock.calls[0][1];
      const mockRequest = {
        url: "/lens-ui/assets/image.png",
      } as FastifyRequest;
      const mockReply = { sendFile: vi.fn() } as unknown as FastifyReply;

      await getHandler(mockRequest, mockReply);

      expect(mockReply.sendFile).toHaveBeenCalledWith("assets/image.png");
    });
  });

  describe("watchRequests", () => {
    let onRequestHook: Function;
    let onSendHook: Function;
    let onResponseHook: Function;

    beforeEach(() => {
      adapter.setConfig({
        app: mockFastifyInstance,
        requestWatcherEnabled: true,
      } as any);
      adapter.setup();

      // Extract the registered hooks
      onRequestHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onRequest",
      )[1];
      onSendHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onSend",
      )[1];
      onResponseHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onResponse",
      )[1];
    });

    it("should set lensContext and start time on onRequest", async () => {
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const done = vi.fn();

      await onRequestHook(mockRequest, mockReply, done);

      expect(lensContext.run).toHaveBeenCalledWith(
        { requestId: "mock-uuid" },
        expect.any(Function),
      );
      expect((mockRequest as any).lensContext).toEqual({
        requestId: "mock-uuid",
      });
      expect((mockRequest as any).lensStartTime).toBeDefined();
      expect(done).toHaveBeenCalled();
    });

    it("should not process ignored paths on onRequest", async () => {
      adapter.setIgnoredPaths([/\/test/]);
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const done = vi.fn();

      await onRequestHook(mockRequest, mockReply, done);

      expect(lensContext.run).not.toHaveBeenCalled();
      expect(done).toHaveBeenCalled();
    });

    it("should capture response payload on onSend", async () => {
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const payload = JSON.stringify({ message: "hello" });

      const result = await onSendHook(mockRequest, mockReply, payload);

      expect((mockReply as any)._lensBody).toEqual({ message: "hello" });
      expect(result).toBe(payload);
    });

    it("should not process ignored paths on onSend", async () => {
      adapter.setIgnoredPaths([/\/test/]);
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const payload = JSON.stringify({ message: "hello" });

      const result = await onSendHook(mockRequest, mockReply, payload);

      expect((mockReply as any)._lensBody).toBeUndefined();
      expect(result).toBe(payload);
    });

    it("should finalize request log on onResponse", async () => {
      const mockRequest = {
        url: "/test",
        method: "GET",
        headers: { "content-type": "application/json" },
        body: { key: "value" },
        ip: "127.0.0.1",
        lensStartTime: process.hrtime(),
      } as unknown as FastifyRequest;
      const mockReply = {
        statusCode: 200,
        getHeaders: vi.fn(() => ({ "x-custom": "header" })),
        _lensBody: { response: "data" },
      } as unknown as FastifyReply;

      await onResponseHook(mockRequest, mockReply);

      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            id: "mock-request-id",
            method: "GET",
            duration: "1ms",
            path: "/test",
            headers: { "content-type": "application/json" },
            body: { key: "value" },
            status: 200,
            ip: "127.0.0.1",
            createdAt: "2023-10-27T10:00:00.000Z",
          }),
          response: expect.objectContaining({
            json: { response: "data" },
            headers: { "x-custom": "header" },
          }),
          user: null,
        }),
        undefined,
      );
    });

    it("should handle non-JSON response payload on onSend", async () => {
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const payload = "plain text response";

      await onSendHook(mockRequest, mockReply, payload);

      expect((mockReply as any)._lensBody).toBe("Purged By Lens");
    });

    it("should handle buffer response payload on onSend", async () => {
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const payload = Buffer.from("binary data");

      await onSendHook(mockRequest, mockReply, payload);

      expect((mockReply as any)._lensBody).toBe("Purged By Lens");
    });

    it("should handle file path response payload on onSend", async () => {
      (fs.existsSync as vi.Mock).mockReturnValue(true);
      const mockRequest = { url: "/test" } as FastifyRequest;
      const mockReply = {} as FastifyReply;
      const payload = "/path/to/file.txt";

      await onSendHook(mockRequest, mockReply, payload);

      expect((mockReply as any)._lensBody).toBe("Purged By Lens");
    });

    it("should handle isAuthenticated and getUser for request log", async () => {
      const mockIsAuthenticated = vi.fn().mockResolvedValue(true);
      const mockGetUser = vi
        .fn()
        .mockResolvedValue({ id: "user123", name: "Test User" });

      adapter.setConfig({
        app: mockFastifyInstance,
        requestWatcherEnabled: true,
        isAuthenticated: mockIsAuthenticated,
        getUser: mockGetUser,
      } as any);
      adapter.setup();

      // Re-extract hooks after config change
      onRequestHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onRequest",
      )[1];
      onSendHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onSend",
      )[1];
      onResponseHook = mockFastifyInstance.addHook.mock.calls.find(
        (call) => call[0] === "onResponse",
      )[1];

      const mockRequest = {
        url: "/auth-test",
        method: "POST",
        headers: {},
        body: { username: "test" },
        ip: "127.0.0.1",
        lensStartTime: process.hrtime(),
      } as unknown as FastifyRequest;
      const mockReply = {
        statusCode: 200,
        getHeaders: vi.fn(() => ({})),
        _lensBody: { status: "success" },
      } as unknown as FastifyReply;

      // Simulate full request lifecycle
      const done = vi.fn();
      await onRequestHook(mockRequest, mockReply, done);
      await onSendHook(
        mockRequest,
        mockReply,
        JSON.stringify({ status: "success" }),
      );
      await onResponseHook(mockRequest, mockReply);

      expect(mockIsAuthenticated).toHaveBeenCalledWith(mockRequest);
      expect(mockGetUser).toHaveBeenCalledWith(mockRequest);
      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            path: "/auth-test",
            status: 200,
          }),
          user: { id: "user123", name: "Test User" },
        }),
        undefined,
      );
    });
  });

  describe("watchQueries", () => {
    it("should log queries when handler calls onQuery", async () => {
      const mockQueryHandler = vi.fn((opts) => {
        opts.onQuery({
          query: "SELECT * FROM users",
          duration: "5ms",
          type: "read",
        });
      });

      adapter.setConfig({
        app: mockFastifyInstance,
        queryWatcher: { enabled: true, handler: mockQueryHandler },
      } as any);
      await adapter.setup();

      expect(mockQueryHandler).toHaveBeenCalled();
      expect(mockQueryWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            query: "SELECT * FROM users",
            duration: "5ms",
            type: "read",
            createdAt: "2023-10-27T10:00:00.000Z",
          }),
          requestId: "mock-request-id",
        }),
      );
    });

    it("should not log queries if queryWatcher is disabled", async () => {
      const mockQueryHandler = vi.fn();
      adapter.setConfig({
        app: mockFastifyInstance,
        queryWatcher: { enabled: false, handler: mockQueryHandler },
      } as any);
      await adapter.setup();

      expect(mockQueryHandler).not.toHaveBeenCalled();
      expect(mockQueryWatcher.log).not.toHaveBeenCalled();
    });
  });

  describe("watchCache", () => {
    it("should log cache events when lensEmitter emits a cache event", async () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        cacheWatcherEnabled: true,
      } as any);
      adapter.setup();

      const cacheOnCall = lensEmitter.on.mock.calls.find(
        (call) => call[0] === "cache",
      );
      expect(cacheOnCall).toBeDefined();

      const cacheData = { key: "my-cache", value: "data" };
      await cacheOnCall[1](cacheData); // Simulate emitter emitting

      expect(mockCacheWatcher.log).toHaveBeenCalledWith(cacheData);
    });

    it("should not log cache events if cacheWatcher is disabled", async () => {
      adapter.setConfig({
        app: mockFastifyInstance,
        cacheWatcherEnabled: false,
      } as any);
      adapter.setup();

      expect(lensEmitter.on).not.toHaveBeenCalledWith(
        "cache",
        expect.any(Function),
      );
      expect(mockCacheWatcher.log).not.toHaveBeenCalled();
    });
  });

  describe("utility methods", () => {
    it("normalizePath should add leading slash if missing", () => {
      expect((adapter as any).normalizePath("test")).toBe("/test");
      expect((adapter as any).normalizePath("/test")).toBe("/test");
    });

    describe("parseResponsePayload", () => {
      it("should parse JSON string payload", () => {
        const payload = JSON.stringify({ data: "json" });
        expect((adapter as any).parseResponsePayload(payload)).toEqual({
          data: "json",
        });
      });

      it("should return object payload as is", () => {
        const payload = { data: "object" };
        expect((adapter as any).parseResponsePayload(payload)).toEqual({
          data: "object",
        });
      });

      it('should return "Purged By Lens" for Buffer payload', () => {
        const payload = Buffer.from("binary");
        expect((adapter as any).parseResponsePayload(payload)).toBe(
          "Purged By Lens",
        );
      });

      it('should return "Purged By Lens" for file path if exists', () => {
        (fs.existsSync as vi.Mock).mockReturnValue(true);
        const payload = "/path/to/file.txt";
        expect((adapter as any).parseResponsePayload(payload)).toBe(
          "Purged By Lens",
        );
      });

      it("should return \"Purged By Lens\" for string payload if not JSON and not file path", () => {
        (fs.existsSync as vi.Mock).mockReturnValue(false);
        const payload = "plain string";
        expect((adapter as any).parseResponsePayload(payload)).toBe(
          "Purged By Lens",
        );
      });

      it("should return null for null payload", () => {
        expect((adapter as any).parseResponsePayload(null)).toBeNull();
      });

      it('should return "Purged By Lens" for unparseable string that is not a file', () => {
        (fs.existsSync as vi.Mock).mockReturnValue(false);
        const payload = "{{invalid json}";
        expect((adapter as any).parseResponsePayload(payload)).toBe(
          "Purged By Lens",
        );
      });
    });

    describe("parseBody", () => {
      it("should parse JSON string body", () => {
        const body = JSON.stringify({ data: "json" });
        expect((adapter as any).parseBody(body)).toEqual({ data: "json" });
      });

      it("should return string body as is if not JSON", () => {
        const body = "plain string";
        expect((adapter as any).parseBody(body)).toBe("plain string");
      });

      it("should return null for null body", () => {
        expect((adapter as any).parseBody(null)).toBeNull();
      });
    });
  });
});
