import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWithLens } from "../src/with_lens";

vi.mock("@lensjs/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lensjs/core")>();
  return {
    ...actual,
    lensContext: {
      ...actual.lensContext,
      run: vi.fn((_ctx, cb) => cb()),
    },
    lensUtils: {
      ...actual.lensUtils,
      generateRandomUuid: vi.fn(() => "gen-uuid"),
      prettyHrTime: vi.fn(() => "2 ms"),
    },
    lensExceptionUtils: {
      ...actual.lensExceptionUtils,
      constructErrorObject: vi.fn((err: Error) => ({
        name: err.name,
        message: err.message,
      })),
    },
  };
});

vi.mock("@lensjs/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lensjs/date")>();
  return { ...actual, nowISO: vi.fn(() => "2023-10-27T10:00:00.000Z") };
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

const makeDeps = (overrides: Record<string, any> = {}) => {
  const requestWatcher = { name: "request", log: vi.fn() } as any;
  const exceptionWatcher = { name: "exception", log: vi.fn() } as any;
  const config = {
    path: "/lens",
    ...overrides,
  } as any;
  return {
    requestWatcher,
    exceptionWatcher,
    config,
    shouldIgnorePath: (p: string) => p.startsWith("/lens"),
  };
};

describe("withLens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("captures the request/response and logs it with hiddenParams", async () => {
    const deps = makeDeps();
    const withLens = createWithLens(deps);
    const handler = withLens(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
    );

    const req = new Request("http://localhost/api/users?ref=1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "John" }),
    });
    const res = await handler(req, undefined);
    expect(res.status).toBe(201);
    await flush();

    expect(deps.requestWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          id: "gen-uuid",
          method: "POST",
          status: 201,
          path: "/api/users?ref=1",
          body: { name: "John" },
          createdAt: "2023-10-27T10:00:00.000Z",
        }),
        response: expect.objectContaining({ json: { ok: true } }),
        user: null,
      }),
      undefined,
    );
  });

  it("passes through ignored paths without logging", async () => {
    const deps = makeDeps();
    const withLens = createWithLens(deps);
    const handler = withLens(async () => new Response("ok"));

    await handler(new Request("http://localhost/lens/api/requests"), undefined);
    await flush();

    expect(deps.requestWatcher.log).not.toHaveBeenCalled();
  });

  it("uses the x-lens-request-id header when present", async () => {
    const deps = makeDeps();
    const withLens = createWithLens(deps);
    const handler = withLens(async () => new Response(null, { status: 200 }));

    await handler(
      new Request("http://localhost/api/x", {
        headers: { "x-lens-request-id": "mw-id" },
      }),
      undefined,
    );
    await flush();

    expect(deps.requestWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ id: "mw-id" }),
      }),
      undefined,
    );
  });

  it("records and rethrows exceptions, logging the request as 500", async () => {
    const deps = makeDeps();
    const withLens = createWithLens(deps);
    const err = new Error("boom");
    const handler = withLens(async () => {
      throw err;
    });

    await expect(
      handler(new Request("http://localhost/api/x"), undefined),
    ).rejects.toThrow("boom");
    await flush();

    expect(deps.exceptionWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error",
        message: "boom",
        requestId: "gen-uuid",
      }),
    );
    expect(deps.requestWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ status: 500 }),
      }),
      undefined,
    );
  });

  it("purges non-JSON response bodies", async () => {
    const deps = makeDeps();
    const withLens = createWithLens(deps);
    const handler = withLens(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "application/octet-stream" },
        }),
    );

    await handler(new Request("http://localhost/api/file"), undefined);
    await flush();

    expect(deps.requestWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ json: "Purged By Lens" }),
      }),
      undefined,
    );
  });

  it("attaches the user when isAuthenticated resolves true", async () => {
    const deps = makeDeps({
      isAuthenticated: vi.fn().mockResolvedValue(true),
      getUser: vi.fn().mockResolvedValue({ id: 1, name: "Jane" }),
    });
    const withLens = createWithLens(deps);
    const handler = withLens(async () => new Response(null, { status: 200 }));

    await handler(new Request("http://localhost/api/me"), undefined);
    await flush();

    expect(deps.requestWatcher.log).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 1, name: "Jane" } }),
      undefined,
    );
  });
});
