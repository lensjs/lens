import {
  assertValidConfig,
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensUtils,
  LensWatcher,
  MailWatcher,
  QueryWatcher,
  RequestWatcher,
  HttpWatcher,
  EventWatcher,
  RedisWatcher,
  FcmWatcher,
  LogWatcher,
  JobWatcher,
  WatcherTypeEnum,
  handleUncaughExceptions,
} from "@lensjs/core";
import type {
  LensNextHandlers,
  NextAdapterConfig,
  NextRouteHandler,
  RequiredNextAdapterConfig,
} from "./types";
import { NextAdapter } from "./adapter";
import { buildRouteHandlers } from "./handlers";
import { createWithLens } from "./with_lens";
import { lensMiddleware } from "./middleware";

const defaultConfig = {
  appName: "Lens",
  enabled: true,
  path: "/lens",
  ignoredPaths: [],
  onlyPaths: [],
  requestWatcherEnabled: true,
  cacheWatcherEnabled: false,
  exceptionWatcherEnabled: true,
  mailWatcherEnabled: false,
  httpWatcherEnabled: false,
  eventWatcherEnabled: false,
  redisWatcherEnabled: false,
  fcmWatcherEnabled: false,
  logWatcherEnabled: false,
  jobWatcherEnabled: false,
};

/**
 * Initialize Lens for a Next.js App Router app. Call once (module singleton) and
 * re-export the returned `handlers` from your catch-all `route.ts` +
 * `lens-config/route.ts`, and wrap your own Route Handlers with `withLens`.
 */
export const createLens = async (config: NextAdapterConfig = {}) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  } as RequiredNextAdapterConfig;

  assertValidConfig(mergedConfig);

  if (!mergedConfig.enabled) {
    const notFound: LensNextHandlers["GET"] = async () =>
      new Response("Not Found", { status: 404 });
    return {
      handlers: {
        GET: notFound,
        POST: notFound,
        DELETE: notFound,
      } as LensNextHandlers,
      withLens: <TContext = unknown>(handler: NextRouteHandler<TContext>) =>
        handler,
      lensMiddleware,
    };
  }

  const adapter = new NextAdapter();
  const watchers: LensWatcher[] = [];

  const defaultWatchers = [
    {
      enabled: mergedConfig.requestWatcherEnabled,
      watcher: new RequestWatcher(),
    },
    {
      enabled: mergedConfig.cacheWatcherEnabled,
      watcher: new CacheWatcher(),
    },
    {
      enabled: mergedConfig.queryWatcher?.enabled,
      watcher: new QueryWatcher(),
    },
    {
      enabled: mergedConfig.exceptionWatcherEnabled,
      watcher: new ExceptionWatcher(),
    },
    {
      enabled: mergedConfig.mailWatcherEnabled,
      watcher: new MailWatcher(),
    },
    {
      enabled: mergedConfig.httpWatcherEnabled,
      watcher: new HttpWatcher(),
    },
    {
      enabled: mergedConfig.eventWatcherEnabled,
      watcher: new EventWatcher(),
    },
    {
      enabled: mergedConfig.redisWatcherEnabled,
      watcher: new RedisWatcher(),
    },
    {
      enabled: mergedConfig.fcmWatcherEnabled,
      watcher: new FcmWatcher(),
    },
    {
      enabled: mergedConfig.logWatcherEnabled,
      watcher: new LogWatcher(),
    },
    {
      enabled: mergedConfig.jobWatcherEnabled,
      watcher: new JobWatcher(),
    },
  ];

  defaultWatchers.forEach((watcher) => {
    if (watcher.enabled) {
      watchers.push(watcher.watcher);
    }
  });

  const { ignoredPaths, normalizedPath } = lensUtils.prepareIgnoredPaths(
    mergedConfig.path,
    mergedConfig.ignoredPaths,
  );

  adapter
    .setConfig(mergedConfig)
    .setIgnoredPaths(ignoredPaths)
    .setOnlyPaths(mergedConfig.onlyPaths);

  await Lens.setAdapter(adapter).setWatchers(watchers).start({
    appName: mergedConfig.appName,
    enabled: mergedConfig.enabled,
    path: normalizedPath,
    authEnabled: !!mergedConfig.auth?.password,
    alerts: mergedConfig.alerts,
  });

  const requestWatcher = watchers.find(
    (w) => w.name === WatcherTypeEnum.REQUEST,
  ) as RequestWatcher | undefined;
  const exceptionWatcher = watchers.find(
    (w) => w.name === WatcherTypeEnum.EXCEPTION,
  ) as ExceptionWatcher | undefined;

  if (exceptionWatcher) {
    handleUncaughExceptions(exceptionWatcher);
  }

  const handlers = buildRouteHandlers(adapter);
  const withLens = createWithLens({
    requestWatcher,
    exceptionWatcher,
    config: mergedConfig,
    shouldIgnorePath: (p: string) => adapter.shouldIgnorePath(p),
  });

  return { handlers, withLens, lensMiddleware };
};

export { NextAdapter } from "./adapter";
export { lensMiddleware } from "./middleware";
export type {
  NextAdapterConfig,
  RequiredNextAdapterConfig,
  LensNextHandlers,
  LensNextHandler,
  NextRouteHandler,
} from "./types";
