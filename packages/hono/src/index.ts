import {
  assertValidConfig,
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensContext,
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
  lensExceptionUtils,
  handleUncaughExceptions,
} from "@lensjs/core";
import type { HonoAdapterConfig, RequiredHonoAdapterConfig } from "./types";
import { HonoAdapter } from "./adapter";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const defaultConfig = {
  appName: "Lens",
  enabled: true,
  path: "/lens",
  ignoredPaths: [],
  onlyPaths: [],
  requestWatcherEnabled: true,
  cacheWatcherEnabled: false,
  exceptionWatcherEnabled: true,
  registerErrorHandler: true,
  mailWatcherEnabled: false,
  httpWatcherEnabled: false,
  eventWatcherEnabled: false,
  redisWatcherEnabled: false,
  fcmWatcherEnabled: false,
  logWatcherEnabled: false,
  jobWatcherEnabled: false,
};

export const lens = async (config: HonoAdapterConfig) => {
  const adapter = new HonoAdapter({ app: config.app });
  const watchers: LensWatcher[] = [];
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  } as RequiredHonoAdapterConfig;

  assertValidConfig(mergedConfig);

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

  if (
    mergedConfig.exceptionWatcherEnabled &&
    mergedConfig.registerErrorHandler
  ) {
    handleExceptions({
      app: mergedConfig.app,
      enabled: mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
      watcher: watchers.find(
        (w) => w.name === WatcherTypeEnum.EXCEPTION,
      ) as ExceptionWatcher,
    });
  }

  await Lens.setAdapter(adapter).setWatchers(watchers).start({
    appName: mergedConfig.appName,
    enabled: mergedConfig.enabled,
    path: normalizedPath,
    authEnabled: !!mergedConfig.auth?.password,
    alerts: mergedConfig.alerts,
  });

  const exceptionWatcher = watchers.find(
    (w) => w.name === WatcherTypeEnum.EXCEPTION,
  ) as ExceptionWatcher;

  return {
    logException: (error: Error) =>
      logException(
        error,
        mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
        exceptionWatcher,
      ),
  };
};

function logException(
  error: Error,
  enabled: boolean,
  watcher?: ExceptionWatcher,
) {
  if (!enabled || !watcher) return;

  watcher.log({
    ...lensExceptionUtils.constructErrorObject(error),
    requestId: lensContext.getStore()?.requestId ?? "",
  });
}

export function handleExceptions({
  app,
  enabled,
  watcher,
}: {
  app: Hono;
  enabled: boolean;
  watcher?: ExceptionWatcher;
}) {
  if (!enabled || !watcher) return;

  app.onError((err, c) => {
    logException(err, enabled, watcher);

    // Preserve Hono's default error behavior: HTTPException carries its own
    // response; anything else is an unexpected 500.
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    console.error(err);
    return c.text("Internal Server Error", 500);
  });

  handleUncaughExceptions(watcher);
}

export { HonoAdapter } from "./adapter";
export type { RequiredHonoAdapterConfig, HonoAdapterConfig } from "./types";
