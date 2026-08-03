import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createLensReader,
  getLensStore,
  type LensReader,
} from "@lensjs/core";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createLensMcpServer,
  type CreateLensMcpServerOptions,
} from "./server";

export interface LensMcpHttpOptions extends CreateLensMcpServerOptions {
  /**
   * Resolve the reader used to answer requests. Defaults to the running app's
   * store via `getLensStore()`, so the handler works with any configured store.
   */
  getReader?: () => LensReader;
  /**
   * Authorize a request from its `Authorization` header. Return false to reject
   * with 401. Wire this to the same auth as the dashboard (e.g. `LensAuth`).
   * When omitted the handler does not perform auth, so only mount it where the
   * surrounding app already restricts access.
   */
  authorize?: (authorization: string | undefined) => boolean;
}

type NodeRequest = IncomingMessage & { body?: unknown };

/**
 * Build a Node HTTP handler that serves the Lens MCP server over Streamable HTTP
 * (stateless: one server + transport per request). Mount it in a running app,
 * e.g. on Express: `app.post("/lens/mcp", createLensMcpHttpHandler({ ... }))`.
 * Add the mount path to Lens's ignored paths so Lens does not record itself.
 */
export function createLensMcpHttpHandler(
  options: LensMcpHttpOptions = {},
): (req: NodeRequest, res: ServerResponse) => Promise<void> {
  const resolveReader =
    options.getReader ?? (() => createLensReader(getLensStore()));

  return async function lensMcpHttpHandler(req, res) {
    if (
      options.authorize &&
      !options.authorize(req.headers["authorization"] as string | undefined)
    ) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({ status: 401, message: "Unauthorized", data: null }),
      );
      return;
    }

    const server = createLensMcpServer(resolveReader(), options);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
}
