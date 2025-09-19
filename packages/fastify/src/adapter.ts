import {
  LensAdapter,
  lensUtils,
  RequestWatcher,
  RouteDefinition,
  WatcherTypeEnum,
  QueryWatcher,
  lensContext,
  CacheWatcher,
  lensEmitter,
  HttpMethod,
} from "@lensjs/core";
import { RequiredFastifyAdapterConfig } from "./types";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as path from "node:path";
import * as fs from "node:fs";
import { nowISO } from "@lensjs/date";
import fastifyStatic from "@fastify/static";

export class FastifyAdapter extends LensAdapter {
  protected app!: FastifyInstance;
  protected config!: RequiredFastifyAdapterConfig;

  constructor({ app }: { app: FastifyInstance }) {
    super();
    this.app = app;
  }

  public setConfig(config: RequiredFastifyAdapterConfig) {
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
          if (this.config.queryWatcher?.enabled) {
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
      this.app.route({
        method: route.method.toUpperCase() as any,
        url: this.normalizePath(route.path),
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
          const result = await route.handler({
            params: request.params as Record<string, string>,
            qs: request.query as Record<string, any>,
          });
          return reply.send(result);
        },
      });
    });
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    this.app.register(fastifyStatic, {
      root: uiPath,
      prefix: `${lensUtils.normalizePath(spaRoute)}/`,
      wildcard: false,
      serve: false,
    });

    this.app.get(`/${spaRoute}/*`, async (request, reply) => {
      const url = request.url;

      if (lensUtils.isStaticFile(url.split("/"))) {
        const filePath = path.join(
          uiPath,
          lensUtils.stripBeforeAssetsPath(url),
        );

        return reply.sendFile(`${path.relative(uiPath, filePath)}`);
      }

      return reply.sendFile("index.html", uiPath);
    });
  }

  private async watchCache(watcher: CacheWatcher) {
    if (!this.config.cacheWatcherEnabled) return;

    lensEmitter.on("cache", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchQueries(watcher: QueryWatcher) {
    if (!this.config.queryWatcher?.enabled) return;

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
          requestId: lensContext.getStore()?.requestId,
        });
      },
    });
  }

  private watchRequests(requestWatcher: RequestWatcher) {
    if (!this.config.requestWatcherEnabled) return;

    // Use Fastify's onRequest hook to intercept all requests
    this.app.addHook(
      "onRequest",
      (request: FastifyRequest, _: FastifyReply, done) => {
        if (this.shouldIgnorePath(request.url)) return done();

        const context = {
          requestId: lensUtils.generateRandomUuid(),
        };

        (request as any).lensContext = context;
        (request as any).lensStartTime = process.hrtime();

        lensContext.run(context, done);
      },
    );

    // Use onSend hook to capture response data
    this.app.addHook(
      "onSend",
      async (request: FastifyRequest, reply: FastifyReply, payload) => {
        if (this.shouldIgnorePath(request.url)) return payload;

        // Store the response payload for logging
        (reply as any)._lensBody = this.parseResponsePayload(payload);

        return payload;
      },
    );

    // Use onResponse hook to finalize logging
    this.app.addHook(
      "onResponse",
      async (request: FastifyRequest, reply: FastifyReply) => {
        if (this.shouldIgnorePath(request.url)) return;

        const startTime = (request as any).lensStartTime;

        await this.finalizeRequestLog(
          request,
          reply,
          requestWatcher,
          startTime,
        );
      },
    );
  }

  private async finalizeRequestLog(
    request: FastifyRequest,
    reply: FastifyReply,
    requestWatcher: RequestWatcher,
    start: [number, number],
  ) {
    try {
      const duration = lensUtils.prettyHrTime(process.hrtime(start));
      const logPayload = {
        request: {
          id:
            lensContext.getStore()?.requestId || lensUtils.generateRandomUuid(),
          method: request.method as HttpMethod,
          duration,
          path: request.url,
          headers: request.headers,
          body: request.body ?? {},
          status: reply.statusCode,
          ip: request.ip ?? "",
          createdAt: nowISO(),
        },
        response: {
          json: this.parseBody((reply as any)._lensBody),
          headers: reply.getHeaders() as Record<string, string>,
        },
        user: (await this.config.isAuthenticated?.(request))
          ? await this.config.getUser?.(request)
          : null,
      };

      await requestWatcher.log(logPayload);
    } catch (err) {
      console.error("Error finalizing request log:", err);
    }
  }

  private parseResponsePayload(payload: any): any {
    if (!payload) {
      return null;
    }

    try {
      // Handle different payload types
      if (typeof payload === "string") {
        // Try to parse as JSON first
        try {
          return JSON.parse(payload);
        } catch {
          // Check if it's a file path
          const filePath = path.resolve(payload);
          if (fs.existsSync(filePath)) {
            return "Purged By Lens";
          }
          return payload;
        }
      } else if (Buffer.isBuffer(payload)) {
        return "Purged By Lens";
      } else if (typeof payload === "object") {
        return payload;
      } else {
        return payload;
      }
    } catch {
      return "Purged By Lens";
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
