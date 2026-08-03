import {
  LensAdapter,
  createSamplingState,
  createTraceContext,
  finalizeCapture,
  lensUtils,
  RequestWatcher,
  type RouteDefinition,
  WatcherTypeEnum,
  QueryWatcher,
  lensContext,
  CacheWatcher,
  lensEmitter,
  lensStream,
  getLensStore,
  type HttpMethod,
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
import type { RequiredHonoAdapterConfig } from "./types";
import type { Context, Hono } from "hono";
import { streamSSE } from "hono/streaming";
import * as path from "node:path";
import * as fs from "node:fs";
import { nowISO } from "@lensjs/date";

export class HonoAdapter extends LensAdapter {
  protected app!: Hono;
  protected config!: RequiredHonoAdapterConfig;
  private auth?: LensAuth;

  constructor({ app }: { app: Hono }) {
    super();
    this.app = app;
  }

  public setConfig(config: RequiredHonoAdapterConfig) {
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
      this.app.on(route.method, this.normalizePath(route.path), async (c) => {
        if (
          auth.enabled &&
          route.path !== "/lens-config" &&
          !auth.authorize(c.req.header("authorization"))
        ) {
          return c.json(
            { status: 401, message: "Unauthorized", data: null },
            401,
          );
        }

        const result = await route.handler({
          params: c.req.param(),
          qs: c.req.query(),
        });

        return c.json(result);
      });
    });

    this.registerStreamRoute(auth);
  }

  /**
   * Server-Sent Events live tail. Fed by the in-process `lensStream`, with
   * coalescing (throttled flush + bounded buffer -> a "gap" event under
   * overload), heartbeats, `Last-Event-ID`/`?after=` backfill, and `?token=`
   * auth (the browser `EventSource` API can't send an Authorization header).
   */
  private registerStreamRoute(auth: LensAuth): void {
    if (!this.config?.path) return;

    this.app.get(this.lensApiPath("api/stream"), (c) => {
      if (auth.enabled) {
        const token = c.req.query("token") ?? "";
        if (!auth.authorize(token)) {
          return c.json(
            { status: 401, message: "Unauthorized", data: null },
            401,
          );
        }
      }

      return streamSSE(c, async (stream) => {
        const FLUSH_MS = 250;
        const HEARTBEAT_TICKS = 60; // 60 * 250ms = 15s
        const MAX_BUFFER = 200;
        let buffer: LensEntry[] = [];
        let dropped = 0;
        let lastCursor = 0;
        let closed = false;

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
        stream.onAbort(() => {
          closed = true;
        });

        try {
          await stream.write("retry: 3000\n\n");

          // Backfill anything missed since the client's last seen cursor.
          const resumeFrom = Number(
            c.req.header("last-event-id") ?? c.req.query("after"),
          );
          if (Number.isInteger(resumeFrom) && resumeFrom > 0) {
            try {
              const backfill = await getLensStore().latest<
                Omit<LensEntry, "data">[]
              >({ after: resumeFrom, perPage: 100 }, false);
              if (backfill.data?.length) {
                lastCursor = Math.max(
                  lastCursor,
                  backfill.meta.headCursor ?? 0,
                );
                await stream.writeSSE({
                  id: String(lastCursor),
                  event: "entries",
                  data: JSON.stringify(backfill.data),
                });
              }
            } catch {
              // best-effort backfill; live stream continues regardless
            }
          }

          let ticks = 0;
          while (!closed && !stream.aborted) {
            if (dropped > 0) {
              await stream.writeSSE({
                event: "gap",
                data: JSON.stringify({ dropped }),
              });
              dropped = 0;
            }

            if (buffer.length) {
              const batch = buffer;
              buffer = [];
              await stream.writeSSE({
                id: String(lastCursor),
                event: "entries",
                data: JSON.stringify(batch),
              });
            } else if (++ticks % HEARTBEAT_TICKS === 0) {
              await stream.write(": ping\n\n");
            }

            await stream.sleep(FLUSH_MS);
          }
        } finally {
          lensStream.off("entry", onEntry);
        }
      });
    });
  }

  private registerLoginRoute(auth: LensAuth): void {
    this.app.post(this.lensApiPath("api/auth/login"), async (c) => {
      const ip = this.config.getRequestIp?.(c) ?? this.getIp(c);
      let body: { password?: unknown } = {};
      try {
        body = ((await c.req.json()) ?? {}) as { password?: unknown };
      } catch {
        body = {};
      }

      const result = auth.attemptLogin(ip, body.password);

      if (result.ok) {
        return c.json(
          {
            status: 200,
            message: "Authenticated",
            data: { token: result.token, expiresIn: result.expiresIn },
          },
          200,
        );
      }

      if (result.retryAfter != null) {
        c.header("Retry-After", String(result.retryAfter));
        return c.json(
          {
            status: 429,
            message: "Too many attempts. Please try again later.",
            data: null,
          },
          429,
        );
      }

      return c.json(
        { status: 401, message: "Invalid credentials", data: null },
        401,
      );
    });
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    const route = this.normalizePath(lensUtils.normalizePath(spaRoute));

    this.app.get(route, (c) =>
      this.sendFile(c, path.join(uiPath, "index.html")),
    );

    this.app.get(`${route}/*`, (c) => {
      const url = c.req.path;

      if (lensUtils.isStaticFile(url.split("/"))) {
        return this.sendFile(
          c,
          path.join(uiPath, lensUtils.stripBeforeAssetsPath(url)),
        );
      }

      return this.sendFile(c, path.join(uiPath, "index.html"));
    });
  }

  private async sendFile(c: Context, filePath: string) {
    try {
      const buf = await fs.promises.readFile(filePath);
      const body = buf.buffer.slice(
        buf.byteOffset,
        buf.byteOffset + buf.byteLength,
      ) as ArrayBuffer;
      return c.body(body, 200, { "Content-Type": this.contentType(filePath) });
    } catch {
      return c.notFound();
    }
  }

  private contentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".map": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".txt": "text/plain; charset=utf-8",
    };
    return map[ext] ?? "application/octet-stream";
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

    this.app.use("*", async (c, next) => {
      if (this.shouldIgnorePath(c.req.path)) {
        return next();
      }

      const context: {
        requestId: string;
        sampling?: ReturnType<typeof createSamplingState>;
        trace?: ReturnType<typeof createTraceContext>;
      } = { requestId: lensUtils.generateRandomUuid() };
      const sampling = createSamplingState(this.config.sampling);
      if (sampling) context.sampling = sampling;
      const trace = createTraceContext(c.req.header("traceparent"));
      if (trace) context.trace = trace;
      const start = process.hrtime();

      await lensContext.run(context, async () => {
        try {
          await next();
        } finally {
          // Clone the finalized response synchronously (before Hono streams it
          // to the client) so we can read the body off the critical path. The
          // `finally` also captures requests that errored (a registered
          // `onError` has already set `c.res` by the time `next()` resolves).
          let snapshot: Response | undefined;
          try {
            snapshot = c.res.clone();
          } catch {
            snapshot = undefined;
          }

          // fire-and-forget so we never delay the response
          void this.finalizeRequestLog(
            c,
            snapshot,
            requestWatcher,
            start,
            context.requestId,
          );
        }
      });
    });
  }

  private async finalizeRequestLog(
    c: Context,
    responseSnapshot: Response | undefined,
    requestWatcher: RequestWatcher,
    start: [number, number],
    requestId: string,
  ) {
    try {
      const elapsed = process.hrtime(start);
      const duration = lensUtils.prettyHrTime(elapsed);
      const response = responseSnapshot ?? c.res;

      const logPayload = {
        request: {
          id: requestId,
          method: c.req.method as HttpMethod,
          duration,
          path: this.getPath(c),
          headers: this.headersToObject(c.req.raw.headers),
          body: await this.readRequestBody(c),
          status: response.status,
          ip: this.config.getRequestIp?.(c) ?? this.getIp(c),
          createdAt: nowISO(),
        },
        response: {
          json: responseSnapshot
            ? await this.readResponseBody(responseSnapshot)
            : null,
          headers: this.headersToObject(response.headers),
        },
        user: (await this.config.isAuthenticated?.(c))
          ? await this.config.getUser?.(c)
          : null,
      };

      await requestWatcher.log(logPayload, this.config.hiddenParams);
      await finalizeCapture(
        response.status,
        elapsed[0] * 1000 + elapsed[1] / 1e6,
        this.config.sampling,
      );
    } catch (err) {
      console.error("Error finalizing request log:", err);
    }
  }

  private async readRequestBody(c: Context): Promise<Record<string, any>> {
    const contentType = c.req.header("content-type") ?? "";

    try {
      if (contentType.includes("application/json")) {
        return ((await c.req.json()) ?? {}) as Record<string, any>;
      }

      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        return ((await c.req.parseBody()) ?? {}) as Record<string, any>;
      }
    } catch {
      // body unavailable or consumed in an incompatible way
    }

    return {};
  }

  /**
   * Read the captured response body, keeping JSON/text and purging binary or
   * file/stream bodies to the literal `"Purged By Lens"` (mirrors the express /
   * fastify adapters).
   */
  private async readResponseBody(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType) {
        return null;
      }

      if (contentType.includes("application/json")) {
        return this.parseBody(await response.text());
      }

      if (contentType.startsWith("text/")) {
        const text = await response.text();
        return text.length ? text : null;
      }

      return "Purged By Lens";
    } catch {
      return "Purged By Lens";
    }
  }

  private getPath(c: Context): string {
    try {
      const url = new URL(c.req.url);
      return url.pathname + url.search;
    } catch {
      return c.req.path;
    }
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
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

  private getIp(c: Context): string {
    const xff = c.req.header("x-forwarded-for");
    if (xff) {
      const [ip] = xff.split(",");
      return this.normalizeIp(ip?.trim() ?? "");
    }

    const xRealIp = c.req.header("x-real-ip");
    if (xRealIp) {
      return this.normalizeIp(xRealIp.trim());
    }

    // `@hono/node-server` exposes the underlying Node request (with the socket)
    // on `c.env.incoming`; other runtimes may not provide it.
    const env = c.env as
      | { incoming?: { socket?: { remoteAddress?: string } } }
      | undefined;
    const remote = env?.incoming?.socket?.remoteAddress;
    if (typeof remote === "string") {
      return this.normalizeIp(remote);
    }

    return "";
  }

  private normalizeIp(ip: string): string {
    if (ip.startsWith("::ffff:")) {
      return ip.replace("::ffff:", "");
    }
    return ip;
  }
}
