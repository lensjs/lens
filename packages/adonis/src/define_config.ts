import { configProvider } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { QueryType, UserEntry } from '../../core/dist/types/index.js'
import type {LensConfig as BaseLensConfig} from '@lensjs/core'

type AdonisQueryType = Extract<
  QueryType,
  "postgresql" | "sqlite" | "mysql" | "mariadb" | "plsql" | "transactsql"
>;

export type LensConfig = {
  ignoredPaths: RegExp[]
  onlyPaths: RegExp[]
  watchers: {
    queries: {
      enabled: boolean
      provider: AdonisQueryType
    }
    cache: boolean
    requests: boolean
    exceptions: boolean
  },
  isAuthenticated?: (ctx: HttpContext) => Promise<boolean>,
  getUser?: (ctx: HttpContext) => Promise<UserEntry>,
} & BaseLensConfig

export function defineConfig(config: LensConfig) {
  return configProvider.create(async () => {
    return config
  })
}
