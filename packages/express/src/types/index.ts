import { Express } from "express";
import { QueryWatcherHandler } from "@lensjs/watchers";
import { LensConfig, LensAuthConfig, UserEntry } from "@lensjs/core";
import { Request } from "express";

export type ExpressAdapterConfig = {
  app: Express;
  ignoredPaths?: RegExp[];
  onlyPaths?: RegExp[];
  requestWatcherEnabled?: boolean;
  cacheWatcherEnabled?: boolean;
  exceptionWatcherEnabled?: boolean;
  mailWatcherEnabled?: boolean;
  httpWatcherEnabled?: boolean;
  eventWatcherEnabled?: boolean;
  redisWatcherEnabled?: boolean;
  fcmWatcherEnabled?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: (request: Request) => Promise<boolean>;
  getUser?: (request: Request) => Promise<UserEntry>;
  getRequestIp?: (request: Request) => string;
  /** Password-lock the dashboard. Setting `auth.password` enables it. */
  auth?: LensAuthConfig;
} & Partial<LensConfig>;

export type RequiredExpressAdapterConfig = Required<ExpressAdapterConfig> & {
  queryWatcher?: ExpressAdapterConfig["queryWatcher"];
  isAuthenticated?: ExpressAdapterConfig["isAuthenticated"];
  getUser?: ExpressAdapterConfig["getUser"];
  getRequestIp?: (request: Request) => string;
  auth?: ExpressAdapterConfig["auth"];
};
