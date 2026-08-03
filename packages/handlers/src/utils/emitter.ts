import { LogEvent } from "kysely";
import { createEmittery } from "@lensjs/core";

export interface LensWatcherEvents {
  kyselyQuery: LogEvent & { requestId?: string };
  sequelizeQuery: {
    sql: string;
    timing?: number;
    /** Present on the hook-based (in-context) path from `attachSequelizeLens`. */
    requestId?: string;
    /** Raw bind parameters captured from the query (hook-based path only). */
    bind?: readonly unknown[] | Record<string, unknown>;
  };
  mikroOrmQuery: {
    query: string;
    params: unknown[];
    took?: number;
    requestId?: string;
  };
  drizzleQuery: {
    query: string;
    params: unknown[];
    requestId?: string;
  };
  mongooseQuery: {
    query: string;
    requestId?: string;
  };
  prismaQuery: {
    query: string;
    duration: number;
    provider: string;
    requestId?: string;
  };
}
export const watcherEmitter = createEmittery<LensWatcherEvents>();
