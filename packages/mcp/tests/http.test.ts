import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  WatcherTypeEnum,
  type LensEntry,
  type LensOverview,
  type LensReader,
  type Paginator,
} from "@lensjs/core";
import { createLensMcpHttpHandler } from "../src/http";

const entry: LensEntry = {
  id: "req-1",
  type: WatcherTypeEnum.REQUEST,
  created_at: "2025-01-01T00:00:00.000Z",
  lens_entry_id: null,
  data: { method: "GET", path: "/health", status: 200, duration: "3 ms" },
};

function page(data: LensEntry[]): Paginator<LensEntry[]> {
  return {
    data,
    meta: { nextCursor: null, headCursor: null, hasMore: false, perPage: 20 },
  };
}

const reader: LensReader = {
  list: async () => page([entry]),
  latest: async () => page([entry]),
  find: async () => entry,
  count: async (type) => (type === WatcherTypeEnum.REQUEST ? 1 : 0),
  getOverview: async () => ({ summary: { totalRequests: 1 } }) as LensOverview,
  getExceptionGroups: async () => [],
  getRequestTimeline: async () => null,
};

/** Mount the handler on a real HTTP server, mimicking `express.json()`. */
async function serve(handler: ReturnType<typeof createLensMcpHttpHandler>) {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      (req as { body?: unknown }).body = raw ? JSON.parse(raw) : undefined;
      void handler(req, res);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return { server, url: new URL(`http://127.0.0.1:${port}/mcp`) };
}

describe("createLensMcpHttpHandler", () => {
  let running: Server | undefined;

  afterEach(async () => {
    if (running) await new Promise((resolve) => running!.close(resolve));
    running = undefined;
  });

  it("serves the tool set over Streamable HTTP", async () => {
    const { server, url } = await serve(
      createLensMcpHttpHandler({ getReader: () => reader }),
    );
    running = server;

    const client = new Client({ name: "http-test", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(url));

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain("lens_overview");

    const result = await client.callTool({
      name: "lens_stats",
      arguments: {},
    });
    const text = (result.content as Array<{ text: string }>)[0]?.text ?? "";
    expect(JSON.parse(text).counts.request).toBe(1);

    await client.close();
  });

  it("rejects an unauthorized request with 401", async () => {
    const { server, url } = await serve(
      createLensMcpHttpHandler({
        getReader: () => reader,
        authorize: (authorization) => authorization === "Bearer secret",
      }),
    );
    running = server;

    const denied = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(denied.status).toBe(401);

    const client = new Client({ name: "http-test", version: "1.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(url, {
        requestInit: { headers: { authorization: "Bearer secret" } },
      }),
    );
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThan(0);

    await client.close();
  });
});
