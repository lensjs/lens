import {
  LensAdapter,
  createSamplingState,
  finalizeSampling,
  lensUtils,
  RequestWatcher,
  RouteDefinition,
  WatcherTypeEnum,
  RouteHttpMethod,
  QueryWatcher,
  lensContext,
  CacheWatcher,
  lensEmitter,
  lensStream,
  getLensStore,
  MailWatcher,
  HttpWatcher,
  EventWatcher,
  RedisWatcher,
  FcmWatcher,
  LogWatcher,
  JobWatcher,
  createLensAuth,
  type LensAuth,
  type LensEntry,
  type LensStreamMessage,
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
  private auth?: LensAuth;

  constructor({ app }: { app: Express }) {
    super();
    this.app = app;
  }

  public setConfig(config: RequiredExpressAdapterConfig) {
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
          if (this.config.queryWatcher.enabled) {
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
        case WatcherTypeEnum.LOG:
          if (this.config.logWatcherEnabled) {
            void this.watchLog(watcher as LogWatcher);
          }
          break;
        case WatcherTypeEnum.JOB:
          if (this.config.jobWatcherEnabled) {
            void this.watchJob(watcher as JobWatcher);
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
      this.app[route.method.toLowerCase() as RouteHttpMethod](
        this.normalizePath(route.path),
        async (req: Request, res: Response) => {
          if (
            auth.enabled &&
            route.path !== "/lens-config" &&
            !auth.authorize(req.headers["authorization"])
          ) {
            return res
              .status(401)
              .json({ status: 401, message: "Unauthorized", data: null });
          }

          const result = await route.handler({
            params: req.params,
            qs: req.query,
          });
          return res.json(result);
        },
      );
    });

    this.registerStreamRoute(auth);
  }

  /**
   * Server-Sent Events live tail. Fed by the in-process `lensStream`, with
   * coalescing (throttled flush + bounded buffer → a "gap" event under overload),
   * heartbeats, `Last-Event-ID`/`?after=` backfill, and `?token=` auth (the
   * browser `EventSource` API can't send an Authorization header).
   */
  private registerStreamRoute(auth: LensAuth): void {
    if (!this.config?.path) return;

    this.app.get(
      this.lensApiPath("api/stream"),
      async (req: Request, res: Response) => {
        if (auth.enabled) {
          const token =
            typeof req.query.token === "string" ? req.query.token : "";
          if (!auth.authorize(token)) {
            return res
              .status(401)
              .json({ status: 401, message: "Unauthorized", data: null });
          }
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        res.write("retry: 3000\n\n");
        (res as unknown as { flushHeaders?: () => void }).flushHeaders?.();

        const FLUSH_MS = 250;
        const MAX_BUFFER = 200;
        let buffer: LensEntry[] = [];
        let dropped = 0;
        let lastCursor = 0;

        // Subscribe first so entries arriving during backfill are not lost
        // (the client de-dupes any overlap by id).
        const onEntry = (msg: LensStreamMessage) => {
          buffer.push(msg.entry);
          if (msg.cursor > lastCursor) lastCursor = msg.cursor;
          if (buffer.length > MAX_BUFFER) {
            dropped += buffer.length - MAX_BUFFER;
            buffer = buffer.slice(buffer.length - MAX_BUFFER);
          }
        };
        lensStream.on("entry", onEntry);

        // Backfill anything missed since the client's last seen cursor.
        const resumeFrom = Number(
          req.headers["last-event-id"] ?? req.query.after,
        );
        if (Number.isInteger(resumeFrom) && resumeFrom > 0) {
          try {
            const backfill = await getLensStore().latest<
              Omit<LensEntry, "data">[]
            >({ after: resumeFrom, perPage: 100 }, false);
            if (backfill.data?.length) {
              lastCursor = Math.max(lastCursor, backfill.meta.headCursor ?? 0);
              res.write(
                `id: ${lastCursor}\nevent: entries\ndata: ${JSON.stringify(
                  backfill.data,
                )}\n\n`,
              );
            }
          } catch {
            // best-effort backfill; live stream continues regardless
          }
        }

        const flush = () => {
          if (dropped > 0) {
            res.write(`event: gap\ndata: ${JSON.stringify({ dropped })}\n\n`);
            dropped = 0;
          }
          if (buffer.length) {
            const batch = buffer;
            buffer = [];
            res.write(
              `id: ${lastCursor}\nevent: entries\ndata: ${JSON.stringify(
                batch,
              )}\n\n`,
            );
          }
        };

        const flushTimer = setInterval(flush, FLUSH_MS);
        const heartbeat = setInterval(() => res.write(`: ping\n\n`), 15_000);

        req.on("close", () => {
          lensStream.off("entry", onEntry);
          clearInterval(flushTimer);
          clearInterval(heartbeat);
          res.end();
        });
      },
    );
  }

  private registerLoginRoute(auth: LensAuth): void {
    this.app.post(
      this.lensApiPath("api/auth/login"),
      express.json(),
      async (req: Request, res: Response) => {
        const ip = this.config.getRequestIp?.(req) ?? this.getIp(req);
        const result = auth.attemptLogin(ip, (req.body ?? {}).password);

        if (result.ok) {
          return res.status(200).json({
            status: 200,
            message: "Authenticated",
            data: { token: result.token, expiresIn: result.expiresIn },
          });
        }

        if (result.retryAfter != null) {
          res.setHeader("Retry-After", String(result.retryAfter));
          return res.status(429).json({
            status: 429,
            message: "Too many attempts. Please try again later.",
            data: null,
          });
        }

        return res
          .status(401)
          .json({ status: 401, message: "Invalid credentials", data: null });
      },
    );
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    this.app.use(
      this.normalizePath(spaRoute),
      express.static(uiPath, { fallthrough: true }),
    );

    this.app.get(this.normalizePath(`${spaRoute}/favicon.ico`), (_, res) =>
      res.sendFile("favicon.ico", { root: uiPath }),
    );

    this.app.get(new RegExp(`^/${spaRoute}(?!/api)(/.*)?$`), (req, res) => {
      if (lensUtils.isStaticFile(req.path.split("/"))) {
        const staticFile = lensUtils
          .stripBeforeAssetsPath(req.path)
          .split(path.sep)[1] as string;

        return res.sendFile(staticFile, { root: path.join(uiPath, "assets") });
      }

      return res.sendFile("index.html", { root: uiPath });
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

  private async watchLog(watcher: LogWatcher) {
    if (!this.config.logWatcherEnabled) return;

    lensEmitter.on("log", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchJob(watcher: JobWatcher) {
    if (!this.config.jobWatcherEnabled) return;

    lensEmitter.on("job", async (data) => {
      await watcher?.log(data);
    });
  }

  private async watchQueries(watcher: QueryWatcher) {
    if (!this.config.queryWatcher.enabled) return;

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
          requestId: requestId ?? lensContext.getStore()?.requestId,
        });
      },
    });
  }

  private watchRequests(requestWatcher: RequestWatcher) {
    if (!this.config.requestWatcherEnabled) return;

    this.app.use((req, res, next) => {
      if (this.shouldIgnorePath(req.path)) return next();

      const context: {
        requestId: string;
        sampling?: ReturnType<typeof createSamplingState>;
      } = {
        requestId: lensUtils.generateRandomUuid(),
      };
      const sampling = createSamplingState(this.config.sampling);
      if (sampling) context.sampling = sampling;

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
      const elapsed = process.hrtime(start);
      const duration = lensUtils.prettyHrTime(elapsed);
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
          ip: this.config.getRequestIp?.(req) ?? this.getIp(req),
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

      await requestWatcher.log(logPayload, this.config.hiddenParams);
      await finalizeSampling(
        res.statusCode,
        elapsed[0] * 1000 + elapsed[1] / 1e6,
        this.config.sampling,
      );
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

  private getIp(req: Request): string {
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
