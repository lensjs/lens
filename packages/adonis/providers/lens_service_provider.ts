import { configProvider } from '@adonisjs/core'
import { Exception, RuntimeException } from '@poppinss/utils'
import type { ApplicationService } from '@adonisjs/core/types'
import { LensConfig } from '../src/define_config.js'
import {
  QueryEntry,
  Lens,
  lensUtils,
  RequestWatcher,
  QueryWatcher,
  CacheWatcher,
  lensExceptionUtils,
  ExceptionWatcher,
  handleUncaughExceptions,
} from '@lensjs/core'
import { HttpContext } from '@adonisjs/core/http'
import AdonisAdapter from '../src/adapter.js'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    lensConfig: LensConfig
    queries?: QueryEntry['data'][]
    watchExceptions?: (error: Exception, ctx: HttpContext) => Promise<void>
  }
}

export default class LensServiceProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const lensConfigProvider = this.app.config.get<any>('lens')
    const config = await configProvider.resolve<LensConfig>(this.app, lensConfigProvider)
    const watchersMap = {
      requests: new RequestWatcher(),
      queries: new QueryWatcher(),
      cache: new CacheWatcher(),
      exceptions: new ExceptionWatcher(),
    }

    if (!config) {
      throw new RuntimeException(
        'Invalid "config/lens.ts" file. Make sure you are using the "defineConfig" method'
      )
    }

    const { normalizedPath, ignoredPaths } = lensUtils.prepareIgnoredPaths(
      config.path,
      config.ignoredPaths
    )
    config.ignoredPaths = ignoredPaths

    if (config.watchers.exceptions) {
      this.app.container.bindValue('watchExceptions', async (error, ctx) => {
        if (!config.enabled) return

        const payload = lensExceptionUtils.constructErrorObject(error)
        const requestId = ctx.request.lensEntry?.requestId

        await watchersMap.exceptions?.log({
          ...payload,
          requestId,
        })
      })

      handleUncaughExceptions(watchersMap.exceptions)
    }

    this.app.container.bindValue('lensConfig', config)
    this.app.booted(async () => {
      const allowedWatchers = Object.keys(config.watchers)
        .filter((watcher) => config.watchers[watcher as keyof typeof config.watchers])
        .map((watcher) => watchersMap[watcher as keyof typeof watchersMap])
        .filter((watcher) => !!watcher)

      const adapter = new AdonisAdapter({ app: this.app })
        .setConfig(config)
        .setIgnoredPaths(ignoredPaths)
        .setOnlyPaths(config.onlyPaths)

      await Lens.setWatchers(allowedWatchers).setAdapter(adapter).start({
        path: normalizedPath,
        enabled: config.enabled,
        appName: config.appName,
      })
    })
  }
}
