#!/usr/bin/env node
import { BetterSqliteStore, createLensReader } from "@lensjs/core";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLensMcpServer } from "./server";

type CliOptions = { databasePath: string };

function parseArgs(argv: string[]): CliOptions {
  let databasePath = process.env.LENS_DB_PATH ?? "lens.db";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if ((arg === "--db" || arg === "--database") && next) {
      databasePath = next;
      i++;
    } else if (arg && arg.startsWith("--db=")) {
      databasePath = arg.slice("--db=".length);
    }
  }

  return { databasePath };
}

async function main(): Promise<void> {
  const { databasePath } = parseArgs(process.argv.slice(2));

  // Open the Lens database read-only: the MCP server never mutates captured data.
  const store = new BetterSqliteStore({ databasePath, readonly: true });
  await store.initialize();

  const server = createLensMcpServer(createLensReader(store));
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the JSON-RPC channel; all diagnostics go to stderr.
  console.error(`[lens-mcp] serving MCP over stdio (database: ${databasePath})`);

  const shutdown = () => {
    void server.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("[lens-mcp] fatal:", error);
  process.exit(1);
});
