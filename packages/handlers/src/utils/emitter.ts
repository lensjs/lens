import { LogEvent } from "kysely";
import { createEmittery } from "@lensjs/core";

export interface LensWatcherEvents {
  kyselyQuery: LogEvent;
  sequelizeQuery: { sql: string; timing?: number };
  mikroOrmQuery: { query: string; params: unknown[]; took?: number };
}
export const watcherEmitter = createEmittery<LensWatcherEvents>();
