/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Node lens variables
  |----------------------------------------------------------
  */
  LENS_BASE_PATH: Env.schema.string.optional(),
  LENS_ENABLED: Env.schema.boolean.optional(),
  LENS_ENABLE_QUERY_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_REQUEST_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_CACHE_WATCHER: Env.schema.boolean.optional(),
  LENS_ENABLE_EXCEPTION_WATCHER: Env.schema.boolean.optional()
})
