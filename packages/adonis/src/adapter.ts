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
} from '@lensjs/core'
import * as path from 'path'
import type { ApplicationService, EmitterService, HttpRouterService } from '@adonisjs/core/types'
import { assertCacheBindingRegistered, shouldIgnoreLogging } from './utils/index.js'
import string from '@adonisjs/core/helpers/string'
import { HttpContext } from '@adonisjs/core/http'
import { LensConfig } from './define_config.js'
import { nowISO } from '@lensjs/date'
import emitter from '@adonisjs/core/services/emitter'

export default class AdonisAdapter extends LensAdapter {
  protected app: ApplicationService
  protected router!: HttpRouterService
  protected emitter!: EmitterService
  protected isRequestWatcherEnabled = false
  protected queryWatcher?: QueryWatcher
  protected config!: LensConfig

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
        }
      }
    })
  }

  public setConfig(config: LensConfig) {
    this.config = config
    return this
  }

  registerRoutes(routes: RouteDefinition[]): void {
    this.app.booted(async () => {
      routes.forEach((route) => {
        this.router[route.method.toLowerCase() as RouteHttpMethod](
          route.path,
          async (ctx: HttpContext) => {
            const data = await route.handler({ params: ctx.params, qs: ctx.request.qs() })
            return ctx.response.json(data)
          }
        )
      })
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
      emitter.on('db:query', async function (query: any) {
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
