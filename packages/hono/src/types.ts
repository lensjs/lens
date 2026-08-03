import type { Context, Hono } from "hono";
import type { QueryWatcherHandler } from "@lensjs/watchers";
import type { LensConfig, LensAuthConfig, UserEntry } from "@lensjs/core";

export type HonoAdapterConfig = {
  app: Hono;
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
  logWatcherEnabled?: boolean;
  jobWatcherEnabled?: boolean;
  /** Auto-register a global `app.onError` that records exceptions. Defaults to `true`. */
  registerErrorHandler?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: (c: Context) => Promise<boolean>;
  getUser?: (c: Context) => Promise<UserEntry>;
  getRequestIp?: (c: Context) => string;
  /** Password-lock the dashboard. Setting `auth.password` enables it. */
  auth?: LensAuthConfig;
} & Partial<LensConfig>;

export type RequiredHonoAdapterConfig = Required<HonoAdapterConfig> & {
  queryWatcher?: HonoAdapterConfig["queryWatcher"];
  isAuthenticated?: HonoAdapterConfig["isAuthenticated"];
  getUser?: HonoAdapterConfig["getUser"];
  getRequestIp?: HonoAdapterConfig["getRequestIp"];
  auth?: HonoAdapterConfig["auth"];
};
