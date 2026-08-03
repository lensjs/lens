import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LensReader } from "@lensjs/core";
import { registerLensTools } from "./tools";
import { registerLensPrompts } from "./prompts";
import { registerLensResources } from "./resources";

export const LENS_MCP_NAME = "lens";
export const LENS_MCP_VERSION = "0.1.0";

const INSTRUCTIONS = [
  "Lens is an observability tool that has captured this application's HTTP requests, database queries, exceptions, log lines, background jobs, cache operations, sent mail, outbound HTTP calls, events, redis commands, and FCM messages.",
  "Use these tools to investigate problems:",
  "- Call lens_overview first for the health of a time window (throughput, error rate, latency percentiles, slowest endpoints and queries, top exceptions); lens_stats tells you how much of each signal was captured at all.",
  "- Use lens_list_issues to see distinct errors ranked by frequency, then lens_get_exception on an issue's sampleId (or the diagnose_exception / investigate_issue prompts); each exception carries a stack trace and the code frame where it was thrown.",
  "- Use lens_list_requests (minStatus 500 for failures, sortBy duration for slow ones) then lens_get_request to inspect one request with every signal correlated to it.",
  "- Use lens_list_slow_queries for performance problems, lens_list_logs and lens_list_jobs for log lines and background work, and lens_list_entries / lens_get_entry for the remaining signals.",
  "- Filters, search, and time ranges are applied across the whole dataset, not just the page you fetched, so prefer narrowing a query over paging through everything.",
  "All data is read-only and already redacted; you cannot modify the application through this server.",
].join("\n");

export interface CreateLensMcpServerOptions {
  /** Server name reported in the MCP handshake (default "lens"). */
  name?: string;
  /** Server version reported in the MCP handshake. */
  version?: string;
}

/**
 * Build a transport-agnostic Lens MCP server: a read-only set of tools, prompts,
 * and resources over the given {@link LensReader}. Connect it to any transport
 * (stdio or Streamable HTTP) with `server.connect(transport)`.
 */
export function createLensMcpServer(
  reader: LensReader,
  options: CreateLensMcpServerOptions = {},
): McpServer {
  const server = new McpServer(
    {
      name: options.name ?? LENS_MCP_NAME,
      version: options.version ?? LENS_MCP_VERSION,
    },
    { instructions: INSTRUCTIONS },
  );

  registerLensTools(server, reader);
  registerLensPrompts(server, reader);
  registerLensResources(server, reader);

  return server;
}
