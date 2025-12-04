import type { ApplicationService } from '@adonisjs/core/types'
import { HttpContext } from '@adonisjs/core/http'
import { LensConfig } from '../define_config.js'
import chalk from 'chalk'

export const runningInConsole = (app: ApplicationService) => {
  return ['console', 'repl', 'test'].includes(app.getEnvironment())
}

export const getRunningCommand = () => {
  const cmd = process.env.ACE_CLI_COMMAND

  if (!cmd) {
    const message = `
${chalk.red.bold('✖ Could not determine running command')}

Make sure to set the environment variable:

  ${chalk.cyan("process.env.ACE_CLI_COMMAND = process.argv[2] ?? ''")}

before creating a new Ignitor instance in:

  ${chalk.yellow('start/server.ts')}
    `

    throw new Error(message)
  }

  return cmd
}

export const assertCacheBindingRegistered = (app: ApplicationService) => {
  if (!app.container.hasBinding('cache.manager')) {
    const message = `
${chalk.red.bold('✖ Cache binding not registered')}

Make sure to install @adonisjs/cache package to use cache watcher.
`

    throw new Error(message)
  }
}

export function allowedCommands() {
  const command = getRunningCommand()

  return ['queue:listen', 'schedule:work'].includes(command ?? 'WRONG')
}

export const shouldIgnoreLogging = (app: ApplicationService) => {
  return runningInConsole(app) && !allowedCommands()
}

export const resolveConfigFromContext = async (ctx: HttpContext): Promise<LensConfig> => {
  return await ctx.containerResolver.make('lensConfig')
}

export function parseDuration(durationStr: string): number {
  const [value, unit] = durationStr.trim().split(' ')
  const num = parseFloat(value)

  switch (unit) {
    case 'ms':
      return num
    case 's':
      return num * 1000
    case 'μs':
    case 'µs':
      return num / 1000
    case 'ns':
      return num / 1_000_000
    case 'min':
      return num * 60_000
    default:
      return 0
  }
}
