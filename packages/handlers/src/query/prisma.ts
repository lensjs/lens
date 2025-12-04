import { lensUtils, QueryType } from "@lensjs/core";
import { PrismaProvider, QueryWatcherHandler } from "../types";

function shouldIgnorePrismaQuery(query: string, provider: QueryType) {
  if (provider === "mongodb") {
    return false;
  }

  const ignoredQueries = ["COMMIT", "BEGIN", "ROLLBACK", "SAVEPOINT"];

  return ignoredQueries.includes(query);
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

export function createPrismaHandler({
  prisma,
  provider,
}: {
  prisma: any ;
  provider: PrismaProvider;
}): QueryWatcherHandler {
  return async ({ onQuery }) => {
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
  };
}
