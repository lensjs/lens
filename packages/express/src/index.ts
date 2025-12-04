import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensUtils,
  LensWatcher,
  QueryWatcher,
  RequestWatcher,
} from "@lensjs/core";
import { ExpressAdapterConfig, RequiredExpressAdapterConfig } from "./types";
import { ExpressAdapter } from "./adapter";
import { WatcherTypeEnum } from "@lensjs/core";
import { lensContext } from "@lensjs/core";
import { handleUncaughExceptions } from "@lensjs/core";
import { lensExceptionUtils } from "@lensjs/core";
import { Application, Request, Response, NextFunction } from "express";

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

export const lens = async (config: ExpressAdapterConfig) => {
  const adapter = new ExpressAdapter({ app: config.app });
  const watchers: LensWatcher[] = [];
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  } as RequiredExpressAdapterConfig;

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

  await Lens.setAdapter(adapter).setWatchers(watchers).start({
    appName: mergedConfig.appName,
    enabled: mergedConfig.enabled,
    path: normalizedPath,
  });

  return {
    handleExceptions: () =>
      handleExceptions({
        app: mergedConfig.app,
        enabled: mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
        watcher: watchers.find((w) => w.name === WatcherTypeEnum.EXCEPTION),
      }),
  };
};

export function handleExceptions({
  app,
  enabled,
  watcher,
}: {
  app: Application;
  enabled: boolean;
  watcher?: ExceptionWatcher;
}) {
  if (!enabled || !watcher) return;

  app.use(async (err: Error, _: Request, __: Response, next: NextFunction) => {
    await watcher.log({
      ...lensExceptionUtils.constructErrorObject(err),
      requestId: lensContext.getStore()?.requestId,
    });

    next(err);
  });

  handleUncaughExceptions(watcher);
}

export { ExpressAdapter } from "./adapter";
export { RequiredExpressAdapterConfig, ExpressAdapterConfig } from "./types";
