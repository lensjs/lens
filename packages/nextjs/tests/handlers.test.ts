import { describe, it, expect, vi } from "vitest";
import { buildRouteHandlers } from "../src/handlers";
import type { NextAdapter } from "../src/adapter";

describe("buildRouteHandlers", () => {
  it("exposes GET/POST/DELETE that delegate to adapter.dispatch", async () => {
    const dispatch = vi.fn(async () => new Response("ok", { status: 200 }));
    const handlers = buildRouteHandlers({ dispatch } as unknown as NextAdapter);

    const req = new Request("http://localhost/lens/api/requests");
    const res = await handlers.GET(req);

    expect(dispatch).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
    expect(handlers).toHaveProperty("POST");
    expect(handlers).toHaveProperty("DELETE");
  });

  it("returns a 404 when dispatch does not match", async () => {
    const dispatch = vi.fn(async () => null);
    const handlers = buildRouteHandlers({ dispatch } as unknown as NextAdapter);

    const res = await handlers.POST(new Request("http://localhost/other"));
    expect(res.status).toBe(404);
  });
});
