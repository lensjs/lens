import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensUtils,
  LensWatcher,
  QueryWatcher,
  RequestWatcher,
  WatcherTypeEnum,
} from "@lensjs/core";
import { NestLensConfig, RequiredNestLensConfig } from "./types";
import ExpressNestAdapter from "./adapters/next";
import { LensExceptionFilter } from "./exception-filter";
import { HttpAdapterHost } from "@nestjs/core";
import FastifyNestAdapter from "./adapters/fastify";

const defaultConfig = {
  adapter: "express",
  appName: "Lens",
  enabled: true,
  path: "/lens",
  ignoredPaths: [],
  onlyPaths: [],
  requestWatcherEnabled: true,
  exceptionWatcherEnabled: true,
  cacheWatcherEnabled: false,
};

export async function lens(config: NestLensConfig) {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  } as RequiredNestLensConfig;

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
  ];

  defaultWatchers.forEach((w) => {
    if (w.enabled) {
      watchers.push(w.watcher);
    }
  });

  const { ignoredPaths, normalizedPath } = lensUtils.prepareIgnoredPaths(
    mergedConfig.path,
    mergedConfig.ignoredPaths,
  );

  mergedConfig.path = normalizedPath;

  let adapter;

  switch (mergedConfig.adapter) {
    case "express":
      adapter = new ExpressNestAdapter({
        app: mergedConfig.app.getHttpAdapter().getInstance(),
      });
      break;
    case "fastify":
      adapter = new FastifyNestAdapter({
        app: mergedConfig.app.getHttpAdapter().getInstance(),
      });
      mergedConfig.exceptionWatcherEnabled = false;
      break;
    default:
      throw new Error("Lens Only Supports Express And Fastify Adapters");
  }

  adapter = adapter
    .setIgnoredPaths(ignoredPaths)
    .setConfig({
      ...mergedConfig,
      app: mergedConfig.app.getHttpAdapter().getInstance(),
    })
    .setOnlyPaths(mergedConfig.onlyPaths);

  // Catch exceptions
  const { httpAdapter } = mergedConfig.app.get(HttpAdapterHost);

  mergedConfig.app.useGlobalFilters(
    new LensExceptionFilter(
      httpAdapter,
      mergedConfig.exceptionWatcherEnabled && mergedConfig.enabled,
      watchers.find((w) => w.name === WatcherTypeEnum.EXCEPTION),
    ),
  );

  await Lens.setAdapter(adapter).setWatchers(watchers).start({
    appName: mergedConfig.appName,
    enabled: mergedConfig.enabled,
    basePath: normalizedPath,
  });
}
