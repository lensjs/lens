import {
  LensAdapter,
  lensUtils,
  RequestWatcher,
  type RouteDefinition,
  WatcherTypeEnum,
  QueryWatcher,
  lensContext,
  CacheWatcher,
  lensEmitter,
  type HttpMethod,
  MailWatcher,
  HttpWatcher,
  EventWatcher,
  RedisWatcher,
  FcmWatcher,
  createLensAuth,
  type LensAuth,
} from "@lensjs/core";
import type { RequiredFastifyAdapterConfig } from "./types.ts";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as path from "node:path";
import * as fs from "node:fs";
import { nowISO } from "@lensjs/date";
import fastifyStatic from "@fastify/static";

export class FastifyAdapter extends LensAdapter {
  protected app!: FastifyInstance;
  protected config!: RequiredFastifyAdapterConfig;
  private auth?: LensAuth;

  constructor({ app }: { app: FastifyInstance }) {
    super();
    this.app = app;
  }

  public setConfig(config: RequiredFastifyAdapterConfig) {
    this.config = config;
    return this;
  }

  private getAuth(): LensAuth {
    if (!this.auth) {
      this.auth = createLensAuth(this.config?.auth);
    }
    return this.auth;
  }

  private lensApiPath(suffix: string): string {
    const base = this.config.path.replace(/^\/+|\/+$/g, "");
    return this.normalizePath(`/${base}/${suffix.replace(/^\/+/, "")}`);
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
        case WatcherTypeEnum.MAIL:
          if (this.config.mailWatcherEnabled) {
            void this.watchMail(watcher as MailWatcher);
          }
          break;
        case WatcherTypeEnum.HTTP:
          if (this.config.httpWatcherEnabled) {
            void this.watchHttp(watcher as HttpWatcher);
          }
          break;
        case WatcherTypeEnum.EVENT:
          if (this.config.eventWatcherEnabled) {
            void this.watchEvent(watcher as EventWatcher);
          }
          break;
        case WatcherTypeEnum.REDIS:
          if (this.config.redisWatcherEnabled) {
            void this.watchRedis(watcher as RedisWatcher);
          }
          break;
        case WatcherTypeEnum.FCM:
          if (this.config.fcmWatcherEnabled) {
            void this.watchFcm(watcher as FcmWatcher);
          }
          break;
      }
    }
  }

  registerRoutes(routes: RouteDefinition[]): void {
    const auth = this.getAuth();

    if (auth.enabled) {
      this.registerLoginRoute(auth);
    }

    routes.forEach((route) => {
      this.app.route({
        method: route.method.toUpperCase() as any,
        url: this.normalizePath(route.path),
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
          if (
            auth.enabled &&
            route.path !== "/lens-config" &&
            !auth.authorize(request.headers["authorization"])
          ) {
            return reply
              .code(401)
              .send({ status: 401, message: "Unauthorized", data: null });
          }

          const result = await route.handler({
            params: request.params as Record<string, string>,
            qs: request.query as Record<string, any>,
          });
          return reply.send(result);
        },
      });
    });
  }

  private registerLoginRoute(auth: LensAuth): void {
    this.app.post(
      this.lensApiPath("api/auth/login"),
      async (request: FastifyRequest, reply: FastifyReply) => {
        const ip = this.config.getRequestIp?.(request) ?? this.getIp(request);
        const body = (request.body ?? {}) as { password?: unknown };
        const result = auth.attemptLogin(ip, body.password);

        if (result.ok) {
          return reply.code(200).send({
            status: 200,
            message: "Authenticated",
            data: { token: result.token, expiresIn: result.expiresIn },
          });
        }

        if (result.retryAfter != null) {
          reply.header("Retry-After", String(result.retryAfter));
          return reply.code(429).send({
            status: 429,
            message: "Too many attempts. Please try again later.",
            data: null,
          });
        }

        return reply
          .code(401)
          .send({ status: 401, message: "Invalid credentials", data: null });
      },
    );
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    this.app.register(fastifyStatic, {
      root: uiPath,
      prefix: `${this.normalizePath(lensUtils.normalizePath(spaRoute))}/`,
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

  private async watchMail(watcher: MailWatcher) {
    if (!this.config.mailWatcherEnabled) return;

    lensEmitter.on("mail", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchHttp(watcher: HttpWatcher) {
    if (!this.config.httpWatcherEnabled) return;

    lensEmitter.on("http", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchEvent(watcher: EventWatcher) {
    if (!this.config.eventWatcherEnabled) return;

    lensEmitter.on("event", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchRedis(watcher: RedisWatcher) {
    if (!this.config.redisWatcherEnabled) return;

    lensEmitter.on("redis", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchFcm(watcher: FcmWatcher) {
    if (!this.config.fcmWatcherEnabled) return;

    lensEmitter.on("fcm", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchQueries(watcher: QueryWatcher) {
    if (!this.config.queryWatcher?.enabled) return;

    const handler = this.config.queryWatcher.handler;

    await handler({
      onQuery: async (query, requestId) => {
        const queryPayload = {
          query: query.query,
          duration: query.duration || "0 ms",
          createdAt: query.createdAt || nowISO(),
          type: query.type,
        };

        await watcher?.log({
          data: queryPayload,
          requestId: requestId ?? lensContext.getStore()?.requestId ?? "",
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
          ip: this.config.getRequestIp?.(request) ?? this.getIp(request),
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

      await requestWatcher.log(logPayload, this.config.hiddenParams);
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
          return "Purged By Lens"; // Return Purged By Lens for unparseable strings that are not file paths
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

  private getIp(req: FastifyRequest): string {
    if (req.ip) return this.normalizeIp(req.ip);

    const xff = req.headers["x-forwarded-for"];

    if (typeof xff === "string") {
      const [ip] = xff.split(",");

      return this.normalizeIp(ip?.trim() ?? "");
    }

    if (Array.isArray(xff) && xff.length > 0) {
      const ips = xff[0]?.split(",");

      if (ips && ips.length > 0) {
        return this.normalizeIp(ips[0]?.trim() ?? "");
      }
    }

    return this.normalizeIp(req.socket?.remoteAddress ?? "");
  }

  private normalizeIp(ip: string): string {
    if (ip.startsWith("::ffff:")) {
      return ip.replace("::ffff:", "");
    }
    return ip;
  }
}
