import {
  ResourceTemplate,
  type McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { WatcherTypeEnum, type LensEntry, type LensReader } from "@lensjs/core";

// List rows are typed as Omit<LensEntry, "data"> but carry the compact
// minimal_data under `data` at runtime; read it through LensEntry.
function minimalData(row: unknown): Record<string, any> {
  return ((row as LensEntry).data ?? {}) as Record<string, any>;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Register readable resources so an agent can reference the current health
 * snapshot or a specific exception / request timeline by URI (e.g.
 * `lens://exception/<id>`), with a `list` callback for discovery. Data is
 * read-only and already redacted.
 */
export function registerLensResources(
  server: McpServer,
  reader: LensReader,
): void {
  server.registerResource(
    "lens-overview",
    "lens://overview",
    {
      title: "Lens overview",
      description:
        "Aggregated health for the last 24 hours: throughput, error rate, latency percentiles, slowest endpoints and queries, top exceptions.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(await reader.getOverview(), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "lens-exception",
    new ResourceTemplate("lens://exception/{id}", {
      list: async () => {
        const page = await reader.list(WatcherTypeEnum.EXCEPTION, {
          perPage: 50,
        });
        return {
          resources: page.data.map((entry) => {
            const data = minimalData(entry);
            return {
              uri: `lens://exception/${entry.id}`,
              name: `${data.name ?? "Exception"}: ${data.message ?? entry.id}`,
              mimeType: "application/json",
            };
          }),
        };
      },
    }),
    {
      title: "Lens exception",
      description:
        "A captured exception with its stack trace and code frame.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const exception = await reader.find(
        WatcherTypeEnum.EXCEPTION,
        firstValue(variables.id),
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(exception ?? { error: "not found" }, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    "lens-request",
    new ResourceTemplate("lens://request/{id}", {
      list: async () => {
        const page = await reader.list(WatcherTypeEnum.REQUEST, { perPage: 50 });
        return {
          resources: page.data.map((entry) => {
            const data = minimalData(entry);
            return {
              uri: `lens://request/${entry.id}`,
              name: `${data.method ?? ""} ${data.path ?? entry.id}`.trim(),
              mimeType: "application/json",
            };
          }),
        };
      },
    }),
    {
      title: "Lens request timeline",
      description:
        "A captured request with correlated queries, cache, exceptions, mail, and outbound HTTP.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const timeline = await reader.getRequestTimeline(firstValue(variables.id));
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(timeline ?? { error: "not found" }, null, 2),
          },
        ],
      };
    },
  );
}
