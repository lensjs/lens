import {
  LensAdapter,
  lensUtils,
  type RouteDefinition,
  WatcherTypeEnum,
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
import type { RequiredNextAdapterConfig } from "./types";
import { matchRoute, parseQuery } from "./dispatcher";
import { contentTypeFor, getIpFromRequest, jsonResponse } from "./web";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { nowISO } from "@lensjs/date";

export class NextAdapter extends LensAdapter {
  protected config!: RequiredNextAdapterConfig;
  private auth?: LensAuth;
  private routes: RouteDefinition[] = [];
  private uiPath = "";
  private spaRoute = "";

  public setConfig(config: RequiredNextAdapterConfig) {
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
        // Request capture in Next.js is done by the `withLens()` wrapper, not a
        // global middleware — there is no central app to hook into.
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
    this.routes = routes;
  }

  serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    this.uiPath = uiPath;
    this.spaRoute = lensUtils.normalizePath(spaRoute);
  }

  /**
   * Match an incoming Web `Request` against the Lens surface (login, SSE, core
   * API routes, dashboard UI). Returns `null` when nothing matches so the host
   * Route Handler can fall back to a 404.
   */
  async dispatch(request: Request): Promise<Response | null> {
    const auth = this.getAuth();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    if (
      auth.enabled &&
      method === "POST" &&
      pathname === this.lensApiPath("api/auth/login")
    ) {
      return this.handleLogin(request, url);
    }

    if (method === "GET" && pathname === this.lensApiPath("api/stream")) {
      if (auth.enabled && !auth.authorize(url.searchParams.get("token") ?? "")) {
        return jsonResponse(
          { status: 401, message: "Unauthorized", data: null },
          401,
        );
      }
      return this.buildStreamResponse(request, url);
    }

    const matched = matchRoute(this.routes, method, pathname);
    if (matched) {
      if (
        auth.enabled &&
        matched.route.path !== "/lens-config" &&
        !auth.authorize(request.headers.get("authorization") ?? undefined)
      ) {
        return jsonResponse(
          { status: 401, message: "Unauthorized", data: null },
          401,
        );
      }

      const result = await matched.route.handler({
        params: matched.params,
        qs: parseQuery(url),
      });
      return jsonResponse(result);
    }

    if (
      this.uiPath &&
      (pathname === this.spaRoute ||
        pathname.startsWith(`${this.spaRoute}/`)) &&
      !pathname.startsWith(`${this.spaRoute}/api`)
    ) {
      return this.serveUiFile(pathname);
    }

    return null;
  }

  private async handleLogin(request: Request, url: URL): Promise<Response> {
    const auth = this.getAuth();
    const ip = this.config.getRequestIp?.(request) ?? getIpFromRequest(request);

    let body: { password?: unknown } = {};
    try {
      body = ((await request.json()) ?? {}) as { password?: unknown };
    } catch {
      body = {};
    }

    const result = auth.attemptLogin(ip, body.password);

    if (result.ok) {
      return jsonResponse(
        {
          status: 200,
          message: "Authenticated",
          data: { token: result.token, expiresIn: result.expiresIn },
        },
        200,
      );
    }

    if (result.retryAfter != null) {
      return new Response(
        JSON.stringify({
          status: 429,
          message: "Too many attempts. Please try again later.",
          data: null,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "Retry-After": String(result.retryAfter),
          },
        },
      );
    }

    return jsonResponse(
      { status: 401, message: "Invalid credentials", data: null },
      401,
    );
  }

  /**
   * Server-Sent Events live tail as a Web `ReadableStream`, fed by the
   * in-process `lensStream` with coalescing, heartbeats, and
   * `Last-Event-ID`/`?after=` backfill. Cleans up on client abort.
   */
  private buildStreamResponse(request: Request, url: URL): Response {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        const FLUSH_MS = 250;
        const MAX_BUFFER = 200;
        let buffer: LensEntry[] = [];
        let dropped = 0;
        let lastCursor = 0;
        let closed = false;

        const send = (chunk: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            closed = true;
          }
        };

        const onEntry = (msg: LensStreamMessage) => {
          buffer.push(msg.entry);
          if (msg.cursor > lastCursor) lastCursor = msg.cursor;
          if (buffer.length > MAX_BUFFER) {
            dropped += buffer.length - MAX_BUFFER;
            buffer = buffer.slice(buffer.length - MAX_BUFFER);
          }
        };
        lensStream.on("entry", onEntry);

        send("retry: 3000\n\n");

        // Backfill anything missed since the client's last seen cursor.
        void (async () => {
          const resumeFrom = Number(
            request.headers.get("last-event-id") ??
              url.searchParams.get("after"),
          );
          if (!Number.isInteger(resumeFrom) || resumeFrom <= 0) return;
          try {
            const res = await getLensStore().latest<Omit<LensEntry, "data">[]>(
              { after: resumeFrom, perPage: 100 },
              false,
            );
            if (res.data?.length) {
              lastCursor = Math.max(lastCursor, res.meta.headCursor ?? 0);
              send(
                `id: ${lastCursor}\nevent: entries\ndata: ${JSON.stringify(
                  res.data,
                )}\n\n`,
              );
            }
          } catch {
            // best-effort backfill; live stream continues regardless
          }
        })();

        const flush = () => {
          if (closed) return;
          if (dropped > 0) {
            send(`event: gap\ndata: ${JSON.stringify({ dropped })}\n\n`);
            dropped = 0;
          }
          if (buffer.length) {
            const batch = buffer;
            buffer = [];
            send(
              `id: ${lastCursor}\nevent: entries\ndata: ${JSON.stringify(
                batch,
              )}\n\n`,
            );
          }
        };

        const flushTimer = setInterval(flush, FLUSH_MS);
        const heartbeat = setInterval(() => send(": ping\n\n"), 15_000);

        const cleanup = () => {
          if (closed) return;
          closed = true;
          lensStream.off("entry", onEntry);
          clearInterval(flushTimer);
          clearInterval(heartbeat);
          try {
            controller.close();
          } catch {
            // already closed
          }
        };

        request.signal.addEventListener("abort", cleanup);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  private async serveUiFile(pathname: string): Promise<Response> {
    if (lensUtils.isStaticFile(pathname.split("/"))) {
      return this.sendFile(
        path.join(this.uiPath, lensUtils.stripBeforeAssetsPath(pathname)),
      );
    }
    return this.sendFile(path.join(this.uiPath, "index.html"));
  }

  private async sendFile(filePath: string): Promise<Response> {
    try {
      const buf = await fsp.readFile(filePath);
      const body = buf.buffer.slice(
        buf.byteOffset,
        buf.byteOffset + buf.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": contentTypeFor(filePath) },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
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

  private normalizePath(pathStr: string) {
    return pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  }
}
