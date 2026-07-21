import { getCurrentRequestId, lensUtils, QueryType } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import { watcherEmitter } from "../utils/emitter";
import { PrismaProvider, QueryWatcherHandler } from "../types";

const TRANSACTION_QUERIES = ["COMMIT", "BEGIN", "ROLLBACK", "SAVEPOINT"];

function shouldIgnorePrismaQuery(query: string, provider: QueryType) {
  if (provider === "mongodb") {
    return false;
  }

  return TRANSACTION_QUERIES.includes(query);
}

function formatQuery(query: string, params: any, provider: QueryType) {
  switch (provider) {
    case "mongodb":
      return query;

    default:
      return lensUtils.formatSqlQuery(
        lensUtils.interpolateQuery(query, params),
        provider,
      );
  }
}

/**
 * Render a Prisma operation as a readable, SQL-like label,
 * e.g. `user.findMany({"where":{"id":1}})`.
 */
function renderPrismaOperation(
  model: string | undefined,
  operation: string,
  args: unknown,
): string {
  const target = model ? `${model}.${operation}` : operation;
  let argStr = "";
  try {
    if (args && typeof args === "object" && Object.keys(args).length > 0) {
      argStr = JSON.stringify(args);
    }
  } catch {
    argStr = "";
  }
  return `${target}(${argStr})`;
}

/**
 * Wrap a PrismaClient so every operation is captured INSIDE the request's
 * async context. Prisma's query engine emits `$on("query")` across a native
 * boundary that drops the async context, so the requestId is captured here (at
 * issue time) instead. Use the returned client for all database access.
 *
 * ```ts
 * const prisma = withLensPrisma(new PrismaClient(), { provider: "postgresql" });
 * await lens({ app, queryWatcher: { enabled: true, handler: createPrismaHandler({ provider: "postgresql" }) } });
 * ```
 */
export function withLensPrisma<T extends { $extends: (extension: any) => any }>(
  client: T,
  { provider }: { provider: PrismaProvider },
): T {
  return client.$extends({
    name: "lensjs",
    query: {
      async $allOperations({ model, operation, args, query }: any) {
        const requestId = getCurrentRequestId();
        const start = process.hrtime.bigint();
        try {
          return await query(args);
        } finally {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          watcherEmitter.emit("prismaQuery", {
            query: renderPrismaOperation(model, operation, args),
            duration: durationMs,
            provider,
            requestId,
          });
        }
      },
    },
  }) as T;
}

export function createPrismaHandler({
  prisma,
  provider,
}: {
  /**
   * @deprecated Prefer wrapping the client with `withLensPrisma()` for correct
   * request correlation. Passing a raw client keeps the legacy `$on("query")`
   * path, which shows raw SQL but cannot attach a requestId.
   */
  prisma?: any;
  provider: PrismaProvider;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
    // Recommended path: correlated operations from `withLensPrisma()`.
    watcherEmitter.on("prismaQuery", (payload) => {
      if (payload.provider !== provider) return;

      onQuery(
        {
          query: payload.query,
          duration: `${payload.duration.toFixed(1)} ms`,
          createdAt: nowISO(),
          type: provider,
        },
        payload.requestId,
      );
    });

    // Legacy path: raw SQL via the engine event (no request correlation).
    if (prisma?.$on) {
      prisma.$on("query", async (e: any) => {
        if (!shouldIgnorePrismaQuery(e.query, provider)) {
          onQuery({
            query: formatQuery(e.query, JSON.parse(e.params), provider),
            duration: `${e.duration} ms`,
            createdAt: e.timestamp,
            type: provider,
          });
        }
      });
    }
  };
}
