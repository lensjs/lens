import { QueryEntry, QueryType, SqlQueryType } from "@lensjs/core";

export type QueryWatcherHandler = (args: {
  /**
   * Report a captured query. Pass `requestId` when the handler captured it
   * in-context (at query-issue time); adapters fall back to the async context
   * when it is omitted.
   */
  onQuery: (query: QueryEntry["data"], requestId?: string) => Promise<void>;
}) => Promise<void>;

export type PrismaProvider = QueryType;
export type SequelizeQueryType = Extract<
  SqlQueryType,
  "mysql" | "postgresql" | "sqlite" | "mariadb"
>;
export type KyselyQueryType = Extract<
  SqlQueryType,
  "mysql" | "postgresql" | "sqlite" | "mssql"
>;

export type MikroOrmQueryType = Extract<
  SqlQueryType,
  "mysql" | "postgresql" | "sqlite" | "mariadb" | "tsql"
>;

export type DrizzleQueryType = Extract<
  SqlQueryType,
  "mysql" | "postgresql" | "sqlite"
>;
