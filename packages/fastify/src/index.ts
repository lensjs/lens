import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensContext,
  lensUtils,
  LensWatcher,
  QueryWatcher,
  RequestWatcher,
} from "@lensjs/core";
import type {
  FastifyAdapterConfig,
  RequiredFastifyAdapterConfig,
} from "./types.ts";
import { FastifyAdapter } from "./adapter.js";
import { WatcherTypeEnum } from "@lensjs/core";
import { lensExceptionUtils } from "@lensjs/core";
import type { FastifyError, FastifyInstance } from "fastify";

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
};

export const lens = async (config: FastifyAdapterConfig) => {
  const adapter = new FastifyAdapter({ app: config.app });
  const watchers: LensWatcher[] = [];
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  } as RequiredFastifyAdapterConfig;

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
    basePath: normalizedPath,
  });

  const exceptionWatcher = watchers.find(
    (w) => w.name === WatcherTypeEnum.EXCEPTION,
  ) as ExceptionWatcher;

  return {
    logException: (error: FastifyError) =>
      logException(
        error,
        mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
        exceptionWatcher,
      ),
  };
};

function logException(
  error: FastifyError,
  enabled: boolean,
  watcher?: ExceptionWatcher,
) {
  if (!enabled || !watcher) return;

  watcher.log({
    ...lensExceptionUtils.constructErrorObject(error),
    requestId: lensContext.getStore()?.requestId ?? "",
  });
}

function handleExceptions({
  app,
  enabled,
  watcher,
}: {
  app: FastifyInstance;
  enabled: boolean;
  watcher?: ExceptionWatcher;
}) {
  app.setErrorHandler((err) => {
    logException(err, enabled, watcher);
  });
}

export { FastifyAdapter } from "./adapter.js";
export type {
  RequiredFastifyAdapterConfig,
  FastifyAdapterConfig,
} from "./types.js";
