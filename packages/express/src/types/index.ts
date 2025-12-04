import { Express } from "express";
import { QueryWatcherHandler } from "@lensjs/watchers";
import { LensConfig, UserEntry } from "@lensjs/core";
import { Request } from "express";

export type ExpressAdapterConfig = {
  app: Express;
  ignoredPaths?: RegExp[];
  onlyPaths?: RegExp[];
  requestWatcherEnabled?: boolean;
  cacheWatcherEnabled?: boolean;
  exceptionWatcherEnabled?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: (request: Request) => Promise<boolean>;
  getUser?: (request: Request) => Promise<UserEntry>;
} & Partial<LensConfig>;

export type RequiredExpressAdapterConfig = Required<ExpressAdapterConfig> & {
  queryWatcher?: ExpressAdapterConfig["queryWatcher"];
  isAuthenticated?: ExpressAdapterConfig["isAuthenticated"];
  getUser?: ExpressAdapterConfig["getUser"];
};
