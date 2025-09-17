import {
  LensAdapter,
  lensUtils,
  RequestWatcher,
  RouteDefinition,
  WatcherTypeEnum,
  RouteHttpMethod,
  QueryWatcher,
  lensContext,
  CacheWatcher,
  lensEmitter,
} from "@lensjs/core";
import { RequiredExpressAdapterConfig } from "./types";
import { Express, Request, Response } from "express";
import * as path from "node:path";
import fs from "node:fs";
import express from "express";
import { nowISO } from "@lensjs/date";

export class ExpressAdapter extends LensAdapter {
  protected app!: Express;
  protected config!: RequiredExpressAdapterConfig;

  constructor({ app }: { app: Express }) {
    super();
    this.app = app;
  }

  public setConfig(config: RequiredExpressAdapterConfig) {
    this.config = config;
    return this;
  }

  setup(): void {
    for (const watcher of this.getWatchers()) {
      switch ((watcher as any).name) {
        case WatcherTypeEnum.REQUEST:
          if (this.config.requestWatcherEnabled) {
            this.watchRequests(watcher as RequestWatcher);
          }
          break;
        case WatcherTypeEnum.QUERY:
          if (this.config.queryWatcher.enabled) {
            void this.watchQueries(watcher as QueryWatcher);
          }
          break;
        case WatcherTypeEnum.CACHE:
          if (this.config.cacheWatcherEnabled) {
            void this.watchCache(watcher as CacheWatcher);
          }
          break;
      }
    }
  }

  registerRoutes(routes: RouteDefinition[]): void {
    routes.forEach((route) => {
      this.app[route.method.toLowerCase() as RouteHttpMethod](
        this.normalizePath(route.path),
        async (req: Request, res: Response) => {
          const result = await route.handler({
            params: req.params,
            qs: req.query,
          });
          return res.json(result);
        },
      );
    });
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    this.app.use(this.normalizePath(spaRoute), express.static(uiPath));

    this.app.get(
      this.normalizePath(`${spaRoute}/favicon.ico`),
      (_: Request, res: Response) =>
        res.sendFile(path.join(uiPath, "favicon.ico")),
    );

    this.app.get(new RegExp(`^/${spaRoute}(?!/api)(/.*)?$`), (req, res) => {
      if (lensUtils.isStaticFile(req.path.split("/"))) {
        return res.download(
          path.join(uiPath, lensUtils.stripBeforeAssetsPath(req.path)),
        );
      }
      return res.sendFile(path.join(uiPath, "index.html"));
    });
  }

  private async watchCache(watcher: CacheWatcher) {
    if (!this.config.cacheWatcherEnabled) return;

    lensEmitter.on("cache", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchQueries(watcher: QueryWatcher) {
    if (!this.config.queryWatcher.enabled) return;

    const handler = this.config.queryWatcher.handler;

    await handler({
      onQuery: async (query) => {
        const queryPayload = {
          query: query.query,
          duration: query.duration || "0 ms",
          createdAt: query.createdAt || nowISO(),
          type: query.type,
        };

        await watcher?.log({
          data: queryPayload,
        });
      },
    });
  }

  private watchRequests(requestWatcher: RequestWatcher) {
    if (!this.config.requestWatcherEnabled) return;

    this.app.use((req, res, next) => {
      if (this.shouldIgnorePath(req.path)) return next();

      const context = {
        requestId: lensUtils.generateRandomUuid(),
      };

      lensContext.run(context, () => {
        const start = process.hrtime();

        this.patchResponseMethods(res);

        res.on("finish", async () => {
          await this.finalizeRequestLog(req, res, requestWatcher, start);
        });

        next();
      });
    });
  }

  private patchResponseMethods(res: Response) {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    (res as any)._body = undefined;

    res.json = function (body?: any) {
      (res as any)._body = body;
      // JSON is always allowed
      return originalJson(body);
    } as typeof res.json;

    res.send = function (body?: any) {
      let safeBody: any;

      try {
        if (!body) {
          safeBody = "Purged By Lens";
        } else if (typeof body === "object" && !Buffer.isBuffer(body)) {
          // JSON object
          safeBody = body;
        } else if (typeof body === "string") {
          const filePath = path.resolve(body);
          // If it's a real file → Purge instead of leaking
          if (fs.existsSync(filePath)) {
            safeBody = "Purged By Lens";
          } else {
            safeBody = body; // normal string
          }
        } else if (Buffer.isBuffer(body)) {
          // binary → purge
          safeBody = "Purged By Lens";
        } else {
          // anything else not safe
          safeBody = "Purged By Lens";
        }
      } catch {
        safeBody = "Purged By Lens";
      }

      (res as any)._body = safeBody;
      return originalSend(safeBody);
    } as typeof res.send;
  }

  private async finalizeRequestLog(
    req: Request,
    res: Response,
    requestWatcher: RequestWatcher,
    start: [number, number],
  ) {
    try {
      const duration = lensUtils.prettyHrTime(process.hrtime(start));
      const logPayload = {
        request: {
          id:
            lensContext.getStore()?.requestId || lensUtils.generateRandomUuid(),
          method: req.method as any,
          duration,
          path: req.originalUrl,
          headers: req.headers,
          body: req.body ?? {},
          status: res.statusCode,
          ip: req.socket?.remoteAddress ?? "",
          createdAt: nowISO(),
        },
        response: {
          json: this.parseBody((res as any)._body),
          headers: res.getHeaders?.() as Record<string, string>,
        },
        user: (await this.config.isAuthenticated?.(req))
          ? await this.config.getUser?.(req)
          : null,
      };

      await requestWatcher.log(logPayload);
    } catch (err) {
      console.error("Error finalizing request log:", err);
    }
  }

  private normalizePath(pathStr: string) {
    return pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  }

  private parseBody(body: any) {
    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body);
    } catch (_e) {
      return body;
    }
  }
}
