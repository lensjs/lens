import { LogEvent } from "kysely";
import { createEmittery } from "@lensjs/core";

export interface LensWatcherEvents {
  kyselyQuery: LogEvent;
  sequelizeQuery: { sql: string; timing?: number };
}
export const watcherEmitter = createEmittery<LensWatcherEvents>();
