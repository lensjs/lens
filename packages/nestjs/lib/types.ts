import { QueryWatcherHandler } from "@lensjs/watchers";
import { UserEntry } from "@lensjs/core";

export type NestLensConfig = {
  adapter?: NestAdapter;
  appName?: string;
  enabled?: boolean;
  path?: string;
  ignoredPaths?: RegExp[];
  onlyPaths?: RegExp[];
  requestWatcherEnabled?: boolean;
  cacheWatcherEnabled?: boolean;
  exceptionWatcherEnabled?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: <T = unknown>(request: T) => Promise<boolean>;
  getUser?: <T = unknown>(request: T) => Promise<UserEntry>;
};

export type RequiredNestLensConfig = Required<NestLensConfig> & {
  queryWatcher?: NestLensConfig["queryWatcher"];
  isAuthenticated?: NestLensConfig["isAuthenticated"];
  getUser?: NestLensConfig["getUser"];
};

export type NestAdapter = "express" | "fastify";
