import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { lensUtils } from '@lensjs/core'

declare module '@adonisjs/core/http' {
  interface Request {
    lensEntry?: {
      requestId: string
    }
  }
}

export default class LensMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const lensEntry = {
      requestId: lensUtils.generateRandomUuid(),
    }

    ctx.request.lensEntry = lensEntry

    return await next()
  }
}
