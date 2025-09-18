import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensUtils,
  LensWatcher,
  QueryWatcher,
  RequestWatcher,
} from "@lensjs/core";
import { FastifyAdapterConfig, RequiredFastifyAdapterConfig } from "./types";
import { FastifyAdapter } from "./adapter";
import { WatcherTypeEnum } from "@lensjs/core";
import { lensExceptionUtils } from "@lensjs/core";
import { FastifyError, FastifyInstance, FastifyRequest } from "fastify";

const defaultConfig = {
  appName: "Lens",
  enabled: true,
  path: "/lens",
  ignoredPaths: [],
  onlyPaths: [],
  requestWatcherEnabled: true,
  cacheWatcherEnabled: false,
  exceptionWatcherEnabled: true,
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

  if (mergedConfig.exceptionWatcherEnabled) {
    handleExceptions({
      app: mergedConfig.app,
      enabled: mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
      watcher: watchers.find((w) => w.name === WatcherTypeEnum.EXCEPTION),
    });
  }

  await Lens.setAdapter(adapter).setWatchers(watchers).start({
    appName: mergedConfig.appName,
    enabled: mergedConfig.enabled,
    basePath: normalizedPath,
  });

  return {
    logException: (error: FastifyError, request: FastifyRequest) =>
      logException(
        error,
        request,
        mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
        watchers.find((w) => w.name === WatcherTypeEnum.EXCEPTION),
      ),
  };
};

function logException(
  error: FastifyError,
  request: FastifyRequest,
  enabled: boolean,
  watcher?: ExceptionWatcher,
) {
  if (!enabled || !watcher) return;

  watcher.log({
    ...lensExceptionUtils.constructErrorObject(error),
    requestId: (request as any).lensContext?.requestId,
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
  app.setErrorHandler((err, req) => {
    logException(err, req, enabled, watcher);
  });
}

export { FastifyAdapter } from "./adapter";
export { RequiredFastifyAdapterConfig, FastifyAdapterConfig } from "./types";
