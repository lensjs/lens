import type { QueryWatcherHandler } from "@lensjs/watchers";
import type { LensConfig, LensAuthConfig, UserEntry } from "@lensjs/core";

export type NextAdapterConfig = {
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

export type RequiredNextAdapterConfig = Required<NextAdapterConfig> & {
  queryWatcher?: NextAdapterConfig["queryWatcher"];
  isAuthenticated?: NextAdapterConfig["isAuthenticated"];
  getUser?: NextAdapterConfig["getUser"];
  getRequestIp?: NextAdapterConfig["getRequestIp"];
  auth?: NextAdapterConfig["auth"];
};

/** A single Lens-provided Next.js Route Handler (bound to one HTTP method). */
export type LensNextHandler = (request: Request) => Promise<Response>;

/** The Route Handlers you re-export from the catch-all `route.ts`. */
export type LensNextHandlers = {
  GET: LensNextHandler;
  POST: LensNextHandler;
  DELETE: LensNextHandler;
};

/** A user Next.js App Router Route Handler, preserving its context type. */
export type NextRouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext,
) => Response | Promise<Response>;
