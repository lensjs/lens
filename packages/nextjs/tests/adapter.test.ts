import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextAdapter } from "../src/adapter";
import type { RouteDefinition } from "@lensjs/core";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn(async () => Buffer.from("<html>lens</html>")),
  };
});

const baseConfig = (overrides: Record<string, any> = {}) =>
  ({
    path: "/lens",
    appName: "Lens",
    enabled: true,
    requestWatcherEnabled: true,
    ...overrides,
  }) as any;

const routes = [
  {
    method: "GET",
    path: "/lens-config",
    handler: async () => ({ appName: "Lens" }),
  },
  {
    method: "GET",
    path: "/lens/api/requests",
    handler: async ({ qs }: any) => ({ status: 200, data: [], qs }),
  },
  {
    method: "GET",
    path: "/lens/api/requests/:id",
    handler: async ({ params }: any) => ({ status: 200, data: params.id }),
  },
] as unknown as RouteDefinition[];

const setupAdapter = (config = baseConfig()) => {
  const adapter = new NextAdapter();
  adapter.setConfig(config).setIgnoredPaths([]).setOnlyPaths([]);
  adapter.registerRoutes(routes);
  adapter.serveUI("/ui", "lens", {});
  return adapter;
};

describe("NextAdapter.dispatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serves a core API route as JSON with parsed query", async () => {
    const adapter = setupAdapter();
    const res = await adapter.dispatch(
      new Request("http://localhost/lens/api/requests?q=x"),
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.qs).toEqual({ q: "x" });
  });

  it("extracts route params", async () => {
    const adapter = setupAdapter();
    const res = await adapter.dispatch(
      new Request("http://localhost/lens/api/requests/abc"),
    );
    const body = await res!.json();
    expect(body.data).toBe("abc");
  });

  it("serves the SPA index.html for a dashboard route", async () => {
    const adapter = setupAdapter();
    const res = await adapter.dispatch(
      new Request("http://localhost/lens/requests"),
    );
    expect(res!.status).toBe(200);
    expect(res!.headers.get("content-type")).toContain("text/html");
  });

  it("returns null for a non-Lens path", async () => {
    const adapter = setupAdapter();
    const res = await adapter.dispatch(
      new Request("http://localhost/not-lens"),
    );
    expect(res).toBeNull();
  });

  it("does not serve the SPA for an unknown api path", async () => {
    const adapter = setupAdapter();
    const res = await adapter.dispatch(
      new Request("http://localhost/lens/api/unknown"),
    );
    expect(res).toBeNull();
  });

  it("401s a protected API route without a token when auth is enabled", async () => {
    const adapter = setupAdapter(baseConfig({ auth: { password: "secret" } }));
    const res = await adapter.dispatch(
      new Request("http://localhost/lens/api/requests"),
    );
    expect(res!.status).toBe(401);
  });

  it("allows /lens-config without auth", async () => {
    const adapter = setupAdapter(baseConfig({ auth: { password: "secret" } }));
    const res = await adapter.dispatch(
      new Request("http://localhost/lens-config"),
    );
    expect(res!.status).toBe(200);
  });
});
