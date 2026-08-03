import type { LensEntry, Paginator } from "@lensjs/core";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Wrap a value as an MCP text result (pretty-printed JSON). */
export function jsonContent(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

/**
 * A tool error the model can see and self-correct from (as opposed to a
 * protocol-level error, which is hidden from it).
 */
export function notFound(kind: string, id: string): CallToolResult {
  return {
    content: [{ type: "text", text: `No ${kind} found with id "${id}".` }],
    isError: true,
  };
}

/** Clamp a requested list size into the supported 1-100 range. */
export function clampLimit(limit: number | undefined, fallback = 20): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return fallback;
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

/**
 * Shape a paginated read as a tool payload: the rows under a name the model can
 * reason about, plus the cursor it needs to page further back.
 */
export function toPage(
  key: string,
  page: Paginator<LensEntry[]>,
): Record<string, unknown> {
  return {
    [key]: page.data ?? [],
    nextCursor: page.meta.nextCursor,
    hasMore: page.meta.hasMore,
  };
}

/** Parse a Lens duration string such as `"12.34 ms"` into a number of ms. */
export function parseDurationMs(duration: unknown): number {
  if (typeof duration !== "string") return 0;
  const value = Number.parseFloat(duration);
  return Number.isFinite(value) ? value : 0;
}
