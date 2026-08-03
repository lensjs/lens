import { describe, it, expect } from "vitest";
import { matchRoute, parseQuery } from "../src/dispatcher";
import type { RouteDefinition } from "@lensjs/core";

const routes = [
  { method: "GET", path: "/lens-config", handler: () => "config" },
  { method: "GET", path: "/lens/api/requests", handler: () => "list" },
  { method: "GET", path: "/lens/api/requests/:id", handler: () => "one" },
  { method: "DELETE", path: "/lens/api/truncate", handler: () => "trunc" },
] as unknown as RouteDefinition[];

describe("matchRoute", () => {
  it("matches a static route", () => {
    const m = matchRoute(routes, "GET", "/lens-config");
    expect(m?.route.path).toBe("/lens-config");
    expect(m?.params).toEqual({});
  });

  it("matches a param route and extracts the param", () => {
    const m = matchRoute(routes, "GET", "/lens/api/requests/abc-123");
    expect(m?.route.path).toBe("/lens/api/requests/:id");
    expect(m?.params).toEqual({ id: "abc-123" });
  });

  it("prefers the static list route over the param route", () => {
    const m = matchRoute(routes, "GET", "/lens/api/requests");
    expect(m?.route.path).toBe("/lens/api/requests");
  });

  it("respects the HTTP method", () => {
    expect(matchRoute(routes, "POST", "/lens/api/requests")).toBeNull();
    expect(matchRoute(routes, "DELETE", "/lens/api/truncate")?.route.path).toBe(
      "/lens/api/truncate",
    );
  });

  it("returns null for an unknown path", () => {
    expect(matchRoute(routes, "GET", "/nope")).toBeNull();
  });

  it("decodes param values", () => {
    const m = matchRoute(routes, "GET", "/lens/api/requests/a%20b");
    expect(m?.params.id).toBe("a b");
  });

  it("tolerates a trailing slash", () => {
    expect(matchRoute(routes, "GET", "/lens-config/")?.route.path).toBe(
      "/lens-config",
    );
  });
});

describe("parseQuery", () => {
  it("flattens the search params", () => {
    expect(parseQuery(new URL("http://x/y?a=1&b=2"))).toEqual({
      a: "1",
      b: "2",
    });
  });

  it("returns an empty object when there is no query", () => {
    expect(parseQuery(new URL("http://x/y"))).toEqual({});
  });
});
