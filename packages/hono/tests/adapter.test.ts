import { describe, it, expect, vi, beforeEach } from "vitest";
import { HonoAdapter } from "../src/adapter";
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
import type { Context, Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { nowISO } from "@lensjs/date";

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
      normalizePath: vi.fn((p: string) => (p.startsWith("/") ? p : `/${p}`)),
      isStaticFile: vi.fn(() => false),
      stripBeforeAssetsPath: vi.fn((url: string) => url),
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

vi.mock("hono/streaming", () => ({
  streamSSE: vi.fn(() => ({ __sse: true })),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn(async () => Buffer.from("<html></html>")),
    },
  };
});

vi.mock("@lensjs/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lensjs/date")>();
  return {
    ...actual,
    nowISO: vi.fn(() => "2023-10-27T10:00:00.000Z"),
  };
});

const mockHonoApp = {
  use: vi.fn(),
  on: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  onError: vi.fn(),
} as unknown as Hono;

const makeContext = (overrides: Record<string, any> = {}): Context => {
  return {
    req: {
      param: vi.fn(() => ({ id: "123" })),
      query: vi.fn(() => ({ q: "abc" })),
      header: vi.fn(() => undefined),
      path: "/test",
      url: "http://localhost/test?q=abc",
      method: "GET",
      raw: { headers: new Headers({ "content-type": "application/json" }) },
      json: vi.fn(async () => ({})),
      parseBody: vi.fn(async () => ({})),
      ...(overrides.req ?? {}),
    },
    res: overrides.res ?? new Response(null, { status: 200 }),
    env: overrides.env ?? {},
    json: vi.fn((data: any, status?: number) => ({ __json: data, status })),
    body: vi.fn((data: any, status?: number, headers?: any) => ({
      __body: data,
      status,
      headers,
    })),
    text: vi.fn((data: any, status?: number) => ({ __text: data, status })),
    header: vi.fn(),
    notFound: vi.fn(() => ({ __notFound: true })),
    ...overrides,
  } as unknown as Context;
};

describe("HonoAdapter", () => {
  let adapter: HonoAdapter;
  let mockRequestWatcher: RequestWatcher;
  let mockCacheWatcher: CacheWatcher;
  let mockQueryWatcher: QueryWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestWatcher = new RequestWatcher();
    mockCacheWatcher = new CacheWatcher();
    mockQueryWatcher = new QueryWatcher();

    adapter = new HonoAdapter({ app: mockHonoApp });
    adapter.setWatchers([
      mockRequestWatcher,
      mockCacheWatcher,
      mockQueryWatcher,
      new ExceptionWatcher(),
    ]);

    (lensContext.getStore as any)
      .mockClear()
      .mockReturnValue({ requestId: "mock-request-id" });
    (lensContext.run as any)
      .mockClear()
      .mockImplementation((_context: any, cb: any) => cb());
    (lensEmitter.on as any).mockClear();
    (lensUtils.generateRandomUuid as any).mockClear().mockReturnValue("mock-uuid");
    (lensUtils.prettyHrTime as any).mockClear().mockReturnValue("1ms");
    (lensUtils.isStaticFile as any).mockClear().mockReturnValue(false);
    (nowISO as any).mockClear().mockReturnValue("2023-10-27T10:00:00.000Z");

    (mockHonoApp.use as any).mockClear();
    (mockHonoApp.on as any).mockClear();
    (mockHonoApp.get as any).mockClear();
    (mockHonoApp.post as any).mockClear();
  });

  it("should be an instance of HonoAdapter", () => {
    expect(adapter).toBeInstanceOf(HonoAdapter);
  });

  it("should set the app instance in the constructor", () => {
    expect((adapter as any).app).toBe(mockHonoApp);
  });

  it("should set config, ignored paths, and only paths (chainable)", () => {
    const config = { app: mockHonoApp, appName: "TestApp" } as any;
    expect(adapter.setConfig(config)).toBe(adapter);
    expect((adapter as any).config).toEqual(config);

    const ignored = [/\/ignore\//];
    adapter.setIgnoredPaths(ignored);
    expect((adapter as any).ignoredPaths).toEqual(ignored);

    const only = [/\/only\//];
    adapter.setOnlyPaths(only);
    expect((adapter as any).onlyPaths).toEqual(only);
  });

  describe("setup", () => {
    it("registers a request middleware when requestWatcherEnabled is true", () => {
      adapter.setConfig({
        app: mockHonoApp,
        requestWatcherEnabled: true,
      } as any);
      adapter.setup();
      expect(mockHonoApp.use).toHaveBeenCalledWith("*", expect.any(Function));
    });

    it("does NOT register a request middleware when requestWatcherEnabled is false", () => {
      adapter.setConfig({
        app: mockHonoApp,
        requestWatcherEnabled: false,
      } as any);
      adapter.setup();
      expect(mockHonoApp.use).not.toHaveBeenCalled();
    });

    it("subscribes to cache events when cacheWatcherEnabled is true", () => {
      adapter.setConfig({
        app: mockHonoApp,
        cacheWatcherEnabled: true,
      } as any);
      adapter.setup();
      expect(lensEmitter.on).toHaveBeenCalledWith("cache", expect.any(Function));
    });

    it("invokes the query handler when queryWatcher.enabled is true", async () => {
      const mockQueryHandler = vi.fn((opts) => {
        opts.onQuery({ query: "SELECT 1", duration: "5ms", type: "sql" });
      });
      adapter.setConfig({
        app: mockHonoApp,
        queryWatcher: { enabled: true, handler: mockQueryHandler },
      } as any);
      await adapter.setup();
      expect(mockQueryHandler).toHaveBeenCalledWith(
        expect.objectContaining({ onQuery: expect.any(Function) }),
      );
    });
  });

  describe("registerRoutes", () => {
    beforeEach(() => {
      adapter.setConfig({ app: mockHonoApp, path: "/lens" } as any);
    });

    it("registers each route with app.on and normalizes the path", () => {
      adapter.registerRoutes([
        { method: "GET", path: "/test", handler: vi.fn() },
        { method: "DELETE", path: "another", handler: vi.fn() },
      ]);

      expect(mockHonoApp.on).toHaveBeenCalledWith(
        "GET",
        "/test",
        expect.any(Function),
      );
      expect(mockHonoApp.on).toHaveBeenCalledWith(
        "DELETE",
        "/another",
        expect.any(Function),
      );
    });

    it("calls the core handler with params + qs and serializes as JSON", async () => {
      const mockHandler = vi.fn().mockResolvedValue({ data: "test" });
      adapter.registerRoutes([
        { method: "GET", path: "/test", handler: mockHandler },
      ]);

      const honoHandler = (mockHonoApp.on as any).mock.calls[0][2];
      const c = makeContext();
      const result = await honoHandler(c);

      expect(mockHandler).toHaveBeenCalledWith({
        params: { id: "123" },
        qs: { q: "abc" },
      });
      expect(c.json).toHaveBeenCalledWith({ data: "test" });
      expect(result).toEqual({ __json: { data: "test" }, status: undefined });
    });

    it("also registers the SSE stream route", () => {
      adapter.registerRoutes([]);
      expect(mockHonoApp.get).toHaveBeenCalledWith(
        "/lens/api/stream",
        expect.any(Function),
      );
    });
  });

  describe("serveUI", () => {
    const uiPath = "/path/to/ui";
    const spaRoute = "lens";

    beforeEach(() => {
      adapter.setConfig({ app: mockHonoApp, path: "/lens" } as any);
    });

    it("registers a GET for the base route and the wildcard", () => {
      adapter.serveUI(uiPath, spaRoute, {});
      expect(mockHonoApp.get).toHaveBeenCalledWith("/lens", expect.any(Function));
      expect(mockHonoApp.get).toHaveBeenCalledWith(
        "/lens/*",
        expect.any(Function),
      );
    });

    it("serves index.html for non-static SPA routes", async () => {
      (lensUtils.isStaticFile as any).mockReturnValue(false);
      adapter.serveUI(uiPath, spaRoute, {});

      const wildcardHandler = (mockHonoApp.get as any).mock.calls.find(
        (call: any[]) => call[0] === "/lens/*",
      )[1];
      const c = makeContext({ req: { path: "/lens/requests" } });
      const res: any = await wildcardHandler(c);

      expect(c.body).toHaveBeenCalledWith(
        expect.anything(),
        200,
        expect.objectContaining({
          "Content-Type": expect.stringContaining("text/html"),
        }),
      );
      expect(res.status).toBe(200);
    });

    it("serves a static asset for asset SPA routes", async () => {
      (lensUtils.isStaticFile as any).mockReturnValue(true);
      (lensUtils.stripBeforeAssetsPath as any).mockReturnValue(
        "assets/app.js",
      );
      adapter.serveUI(uiPath, spaRoute, {});

      const wildcardHandler = (mockHonoApp.get as any).mock.calls.find(
        (call: any[]) => call[0] === "/lens/*",
      )[1];
      const c = makeContext({ req: { path: "/lens/assets/app.js" } });
      await wildcardHandler(c);

      expect(c.body).toHaveBeenCalledWith(
        expect.anything(),
        200,
        expect.objectContaining({
          "Content-Type": expect.stringContaining("text/javascript"),
        }),
      );
    });
  });

  describe("finalizeRequestLog", () => {
    beforeEach(() => {
      adapter.setConfig({
        app: mockHonoApp,
        requestWatcherEnabled: true,
      } as any);
    });

    it("builds the request payload and logs it with hiddenParams", async () => {
      const snapshot = new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
      const c = makeContext({
        req: {
          method: "POST",
          url: "http://localhost/users?ref=1",
          path: "/users",
          header: vi.fn((name: string) =>
            name === "content-type" ? "application/json" : undefined,
          ),
          raw: { headers: new Headers({ "x-test": "1" }) },
          json: vi.fn(async () => ({ name: "John" })),
        },
      });

      await (adapter as any).finalizeRequestLog(
        c,
        snapshot,
        mockRequestWatcher,
        process.hrtime(),
        "req-1",
      );

      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            id: "req-1",
            method: "POST",
            duration: "1ms",
            path: "/users?ref=1",
            body: { name: "John" },
            status: 201,
            createdAt: "2023-10-27T10:00:00.000Z",
          }),
          response: expect.objectContaining({
            json: { ok: true },
          }),
          user: null,
        }),
        undefined,
      );
    });

    it("attaches the user when isAuthenticated resolves true", async () => {
      const isAuthenticated = vi.fn().mockResolvedValue(true);
      const getUser = vi.fn().mockResolvedValue({ id: 1, name: "Jane" });
      adapter.setConfig({
        app: mockHonoApp,
        requestWatcherEnabled: true,
        isAuthenticated,
        getUser,
      } as any);

      const snapshot = new Response(null, { status: 200 });
      const c = makeContext();

      await (adapter as any).finalizeRequestLog(
        c,
        snapshot,
        mockRequestWatcher,
        process.hrtime(),
        "req-2",
      );

      expect(isAuthenticated).toHaveBeenCalledWith(c);
      expect(mockRequestWatcher.log).toHaveBeenCalledWith(
        expect.objectContaining({ user: { id: 1, name: "Jane" } }),
        undefined,
      );
    });
  });

  describe("readResponseBody", () => {
    it("parses a JSON response body", async () => {
      const res = new Response(JSON.stringify({ a: 1 }), {
        headers: { "content-type": "application/json" },
      });
      expect(await (adapter as any).readResponseBody(res)).toEqual({ a: 1 });
    });

    it("keeps a text response body", async () => {
      const res = new Response("hello", {
        headers: { "content-type": "text/plain" },
      });
      expect(await (adapter as any).readResponseBody(res)).toBe("hello");
    });

    it("purges a binary response body", async () => {
      const res = new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "application/octet-stream" },
      });
      expect(await (adapter as any).readResponseBody(res)).toBe(
        "Purged By Lens",
      );
    });

    it("returns null when there is no content-type", async () => {
      const res = new Response(null);
      res.headers.delete("content-type");
      expect(await (adapter as any).readResponseBody(res)).toBeNull();
    });
  });

  describe("utility methods", () => {
    it("normalizePath adds a leading slash if missing", () => {
      expect((adapter as any).normalizePath("test")).toBe("/test");
      expect((adapter as any).normalizePath("/test")).toBe("/test");
    });

    it("parseBody parses JSON strings and passes through others", () => {
      expect((adapter as any).parseBody(JSON.stringify({ a: 1 }))).toEqual({
        a: 1,
      });
      expect((adapter as any).parseBody("plain")).toBe("plain");
      expect((adapter as any).parseBody(null)).toBeNull();
    });

    it("getIp reads x-forwarded-for and normalizes ipv4-mapped addresses", () => {
      const c = makeContext({
        req: {
          header: vi.fn((name: string) =>
            name === "x-forwarded-for" ? "::ffff:127.0.0.1, 10.0.0.1" : undefined,
          ),
        },
      });
      expect((adapter as any).getIp(c)).toBe("127.0.0.1");
    });
  });
});
