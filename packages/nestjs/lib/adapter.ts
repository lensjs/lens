import {
  RouteDefinition,
  LensAdapter,
  WatcherTypeEnum,
  RequestWatcher,
  RequestEntry,
  QueryWatcher,
  CacheWatcher,
  ExceptionWatcher,
  lensExceptionUtils,
  lensContext,
  lensUtils,
  Lens,
} from "@lensjs/core";
import { AbstractHttpAdapter } from "@nestjs/core";
import { RequiredNestLensConfig } from "./types";
import { Request, Response } from "express";
import { Express } from "express";
import express from "express";
import path from "node:path";

export default class NestLensAdapter extends LensAdapter {
  protected httpAdapter!: AbstractHttpAdapter;
  protected isRequestWatcherEnabled = false;
  protected queryWatcher?: QueryWatcher;
  protected cacheWatcher?: CacheWatcher;
  protected exceptionWatcher?: ExceptionWatcher;
  protected config!: RequiredNestLensConfig;

  constructor() {
    super();
  }

  override setup(): void {
    for (const watcher of this.getWatchers()) {
      switch (watcher.name) {
        case WatcherTypeEnum.REQUEST:
          this.isRequestWatcherEnabled = true;
          break;
        case WatcherTypeEnum.QUERY:
          this.queryWatcher = watcher as unknown as QueryWatcher;
          this.watchQueries(watcher);
          break;
        case WatcherTypeEnum.CACHE:
          this.cacheWatcher = watcher as unknown as CacheWatcher;
          this.watchCache(watcher as unknown as CacheWatcher);
          break;
        case WatcherTypeEnum.EXCEPTION:
          this.exceptionWatcher = watcher as unknown as ExceptionWatcher;
          // Exception watching is handled by an exception filter
          break;
      }
    }
  }

  public setConfig(config: RequiredNestLensConfig) {
    this.config = config;
    return this;
  }

  public getConfig(): RequiredNestLensConfig {
    return this.config;
  }

  public setHttpAdapter(httpAdapter: AbstractHttpAdapter) {
    this.httpAdapter = httpAdapter;

    return this;
  }

  // Routes are handled by dynamicRoutes helper
  registerRoutes(_routes: RouteDefinition[]): void {}

  serveUI(
    _uiPath: string,
    _spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {}

  registerUI(app: unknown) {
    if (this.config.adapter === "express") {
      this.handleExpressStatic(app as Express);
    }
  }

  protected watchQueries(_queryWatcher: QueryWatcher): void {
    //TODO: implement query watching
  }

  protected watchCache(_watcher: CacheWatcher) {
    //TODO: implement cache watching
  }

  public async logRequest(requestEntry: RequestEntry) {
    console.log("[Logging Request]", requestEntry);
    await (
      this.getWatchers().find(
        (w) => w.name === WatcherTypeEnum.REQUEST,
      ) as RequestWatcher
    )?.log(requestEntry);
  }

  public async logException(error: Error, request?: any) {
    if (!this.exceptionWatcher) return;

    const requestId =
      lensContext.getStore()?.requestId || request?.lensEntry?.requestId;
    const payload = lensExceptionUtils.constructErrorObject(error);

    await this.exceptionWatcher.log({
      ...payload,
      requestId,
    });
  }

  public getIgnoredPaths() {
    return this.ignoredPaths;
  }

  public getOnlyPaths() {
    return this.onlyPaths;
  }

  private handleExpressStatic(app: Express) {
    const spaPath = this.getConfig().path;
    const uiPath = Lens.getUiPath();

    app.use(lensUtils.normalizePath(spaPath), express.static(uiPath));

    app.get(
      lensUtils.normalizePath(`${spaPath}/favicon.ico`),
      (_: Request, res: Response) =>
        res.sendFile(path.join(uiPath, "favicon.ico")),
    );

    app.get(
      new RegExp(`^/${spaPath}(?!/api)(/.*)?$`),
      (req: Request, res: Response) => {
        if (lensUtils.isStaticFile(req.path.split("/"))) {
          return res.download(
            path.join(uiPath, lensUtils.stripBeforeAssetsPath(req.path)),
          );
        }
        return res.sendFile(path.join(uiPath, "index.html"));
      },
    );
  }
}
