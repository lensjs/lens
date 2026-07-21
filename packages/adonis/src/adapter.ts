import {
  RouteDefinition,
  LensAdapter,
  WatcherTypeEnum,
  lensUtils,
  RequestWatcher,
  RequestEntry,
  QueryWatcher,
  RouteHttpMethod,
  QueryEntry,
  CacheWatcher,
  MailWatcher,
  HttpWatcher,
  EventWatcher,
  RedisWatcher,
  FcmWatcher,
  lensEmitter,
  createLensAuth,
  type LensAuth,
} from '@lensjs/core'
import * as path from 'path'
import type { ApplicationService, EmitterService, HttpRouterService } from '@adonisjs/core/types'
import { assertCacheBindingRegistered, shouldIgnoreLogging } from './utils/index.js'
import { buildMailEntry, type AdonisMailSentEvent } from './mail.js'
import string from '@adonisjs/core/helpers/string'
import { HttpContext } from '@adonisjs/core/http'
import { LensConfig } from './define_config.js'
import { nowISO } from '@lensjs/date'

export default class AdonisAdapter extends LensAdapter {
  protected app: ApplicationService
  protected router!: HttpRouterService
  protected emitter!: EmitterService
  protected isRequestWatcherEnabled = false
  protected queryWatcher?: QueryWatcher
  protected config!: LensConfig
  private auth?: LensAuth

  constructor({ app }: { app: ApplicationService }) {
    super()
    this.app = app
  }

  override setup(): void {
    this.app.booted(async () => {
      this.router = await this.app.container.make('router')
      this.emitter = await this.app.container.make('emitter')

      for (const watcher of this.getWatchers()) {
        switch (watcher.name) {
          case WatcherTypeEnum.REQUEST:
            this.isRequestWatcherEnabled = true
            this.watchRequests(watcher as unknown as RequestWatcher)
            break
          case WatcherTypeEnum.QUERY:
            this.queryWatcher = watcher as unknown as QueryWatcher
            await this.watchQueries(watcher)
            break
          case WatcherTypeEnum.CACHE:
            this.watchCache(watcher as unknown as CacheWatcher)
            break
          case WatcherTypeEnum.MAIL:
            this.watchMail(watcher as unknown as MailWatcher)
            break
          case WatcherTypeEnum.HTTP:
            this.watchHttp(watcher as unknown as HttpWatcher)
            break
          case WatcherTypeEnum.EVENT:
            this.watchEvent(watcher as unknown as EventWatcher)
            break
          case WatcherTypeEnum.REDIS:
            this.watchRedis(watcher as unknown as RedisWatcher)
            break
          case WatcherTypeEnum.FCM:
            this.watchFcm(watcher as unknown as FcmWatcher)
            break
        }
      }
    })
  }

  public setConfig(config: LensConfig) {
    this.config = config
    return this
  }

  private getAuth(): LensAuth {
    if (!this.auth) {
      this.auth = createLensAuth(this.config?.auth)
    }
    return this.auth
  }

  private lensApiPath(suffix: string): string {
    const base = this.config.path.replace(/^\/+|\/+$/g, '')
    return `/${base}/${suffix.replace(/^\/+/, '')}`
  }

  registerRoutes(routes: RouteDefinition[]): void {
    const auth = this.getAuth()

    this.app.booted(async () => {
      if (auth.enabled) {
        this.registerLoginRoute(auth)
      }

      routes.forEach((route) => {
        this.router[route.method.toLowerCase() as RouteHttpMethod](
          route.path,
          async (ctx: HttpContext) => {
            if (
              auth.enabled &&
              route.path !== '/lens-config' &&
              !auth.authorize(ctx.request.header('authorization'))
            ) {
              return ctx.response
                .status(401)
                .json({ status: 401, message: 'Unauthorized', data: null })
            }

            const data = await route.handler({ params: ctx.params, qs: ctx.request.qs() })
            return ctx.response.json(data)
          }
        )
      })
    })
  }

  private registerLoginRoute(auth: LensAuth): void {
    this.router.post(this.lensApiPath('api/auth/login'), async (ctx: HttpContext) => {
      const ip = ctx.request.ip()
      const result = auth.attemptLogin(ip, ctx.request.input('password'))

      if (result.ok) {
        return ctx.response.status(200).json({
          status: 200,
          message: 'Authenticated',
          data: { token: result.token, expiresIn: result.expiresIn },
        })
      }

      if (result.retryAfter != null) {
        ctx.response.header('Retry-After', String(result.retryAfter))
        return ctx.response.status(429).json({
          status: 429,
          message: 'Too many attempts. Please try again later.',
          data: null,
        })
      }

      return ctx.response
        .status(401)
        .json({ status: 401, message: 'Invalid credentials', data: null })
    })
  }

  protected watchRequests(requestWatcher: RequestWatcher): void {
    const self = this

    if (shouldIgnoreLogging(this.app) || !self.isRequestWatcherEnabled) return
    this.emitter.on('http:request_completed', async function (event) {
      if (self.shouldIgnorePath(event.ctx.request.url(false))) return

      const request = event.ctx.request
      const requestId = event.ctx.request.lensEntry?.requestId ?? lensUtils.generateRandomUuid()
      const logPayload: RequestEntry = {
        request: {
          id: requestId,
          method: request.method() as any,
          duration: string.prettyHrTime(event.duration),
          path: request.url(true),
          headers: request.headers() as Record<string, string>,
          body: request.hasBody() ? request.body() : {},
          status: event.ctx.response.response.statusCode,
          ip: request.ip(),
          createdAt: nowISO(),
        },
        response: {
          json: event.ctx.response.getBody(),
          headers: event.ctx.response.getHeaders() as Record<string, string>,
        },
        user: await self.getUserFromContext(event.ctx),
      }

      await requestWatcher.log(logPayload, self.config.hiddenParams)
    })
  }

  protected async watchQueries(queryWatcher: QueryWatcher): Promise<void> {
    const self = this

    this.app.booted(async () => {
      if (shouldIgnoreLogging(self.app)) return

      // @ts-ignore
      self.emitter.on('db:query', async function (query: any) {
        const requestId = HttpContext.get()?.request.lensEntry?.requestId
        const duration: string = query.duration ? string.prettyHrTime(query.duration) : '0 ms'

        const payload: QueryEntry['data'] = {
          query: lensUtils.formatSqlQuery(
            lensUtils.interpolateQuery(query.sql, query.bindings as string[]),
            self.config.watchers.queries.provider
          ),
          duration,
          createdAt: nowISO(),
          type: self.config.watchers.queries.provider,
        }

        await queryWatcher.log({
          data: payload,
          requestId,
        })
      })
    })
  }

  protected async watchCache(watcher: CacheWatcher) {
    if (!this.config.watchers.cache) return

    assertCacheBindingRegistered(this.app)

    // Clear
    // @ts-expect-error
    this.emitter.on('cache:cleared', async (event: any) => {
      await watcher.log({
        action: 'clear',
        data: {
          key: event.key,
        },
        createdAt: nowISO(),
        requestId: HttpContext.get()?.request.lensEntry?.requestId,
      })
    })

    // Write
    // @ts-expect-error
    this.emitter.on('cache:written', async (event: any) => {
      await watcher.log({
        action: 'write',
        data: {
          key: event.key,
          value: event.value,
        },
        createdAt: nowISO(),
        requestId: HttpContext.get()?.request.lensEntry?.requestId,
      })
    })

    // Hit
    // @ts-expect-error
    this.emitter.on('cache:hit', async (event: any) => {
      await watcher.log({
        action: 'hit',
        data: {
          key: event.key,
          value: event.value,
        },
        createdAt: nowISO(),
        requestId: HttpContext.get()?.request.lensEntry?.requestId,
      })
    })

    // Miss
    // @ts-expect-error
    this.emitter.on('cache:miss', async (event: any) => {
      await watcher.log({
        action: 'miss',
        data: {
          key: event.key,
        },
        createdAt: nowISO(),
        requestId: HttpContext.get()?.request.lensEntry?.requestId,
      })
    })

    // Delete
    // @ts-expect-error
    this.emitter.on('cache:deleted', async (event: any) => {
      await watcher.log({
        action: 'delete',
        data: {
          key: event.key,
        },
        createdAt: nowISO(),
        requestId: HttpContext.get()?.request.lensEntry?.requestId,
      })
    })
  }

  protected watchHttp(watcher: HttpWatcher): void {
    if (!this.config.watchers.http) return

    lensEmitter.on('http', async (data) => {
      await watcher.log(data)
    })
  }

  protected watchEvent(watcher: EventWatcher): void {
    if (!this.config.watchers.event) return

    lensEmitter.on('event', async (data) => {
      await watcher.log(data)
    })
  }

  protected watchRedis(watcher: RedisWatcher): void {
    if (!this.config.watchers.redis) return

    lensEmitter.on('redis', async (data) => {
      await watcher.log(data)
    })
  }

  protected watchFcm(watcher: FcmWatcher): void {
    if (!this.config.watchers.fcm) return

    lensEmitter.on('fcm', async (data) => {
      await watcher.log(data)
    })
  }

  protected watchMail(mailWatcher: MailWatcher): void {
    if (!this.config.watchers.mail || shouldIgnoreLogging(this.app)) return

    // @ts-expect-error - 'mail:sent' is emitted by @adonisjs/mail when installed
    this.emitter.on('mail:sent', async (event: AdonisMailSentEvent) => {
      try {
        const requestId = HttpContext.get()?.request.lensEntry?.requestId ?? ''

        await mailWatcher.log(buildMailEntry(event, requestId))
      } catch (error) {
        // Instrumentation must never break the host app.
        console.error('Lens: failed to log mail entry', error)
      }
    })
  }

  serveUI(uiPath: string, spaRoute: string, _dataToInject: Record<string, any>): void {
    this.app.booted(async () => {
      this.router.get(`/${spaRoute}/favicon.ico`, (ctx: HttpContext) => {
        return ctx.response.download(path.join(uiPath, 'favicon.ico'))
      })

      this.router.get(`/${spaRoute}`, (ctx: HttpContext) => {
        return ctx.response.redirect(`/${spaRoute}/requests`)
      })

      this.router.get(`/${spaRoute}/*`, (ctx: HttpContext) => {
        if (lensUtils.isStaticFile(ctx.params['*'])) {
          return this.matchStaticFiles(
            ctx,
            uiPath,
            lensUtils.stripBeforeAssetsPath(ctx.params['*'].join('/'))
          )
        }

        const htmlPath = path.join(uiPath, 'index.html')
        return ctx.response.download(htmlPath, true)
      })
    })
  }

  private matchStaticFiles(ctx: HttpContext, uiPath: string, subPath: string) {
    const assetPath = path.join(uiPath, subPath)

    return ctx.response.download(assetPath)
  }

  private async getUserFromContext(ctx: HttpContext) {
    return (await this.config.isAuthenticated?.(ctx)) && this.config.getUser
      ? await this.config.getUser?.(ctx)
      : null
  }
}
