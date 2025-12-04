/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import { Codemods } from '@adonisjs/core/ace/codemods'
import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

const registerEnvValidation = async (codemods: Codemods) => {
  try {
    await codemods.defineEnvValidations({
      leadingComment: 'LensJs variables',
      variables: {
        LENS_BASE_PATH: 'Env.schema.string.optional()',
        LENS_ENABLED: 'Env.schema.boolean.optional()',
        LENS_ENABLE_QUERY_WATCHER: 'Env.schema.boolean.optional()',
        LENS_ENABLE_REQUEST_WATCHER: 'Env.schema.boolean.optional()',
        LENS_ENABLE_CACHE_WATCHER: 'Env.schema.boolean.optional()',
        LENS_ENABLE_EXCEPTION_WATCHER: 'Env.schema.boolean.optional()',
      },
    })
  } catch (error) {
    console.error(error)
  }
}

const registerMiddleware = async (codemods: Codemods) => {
  try {
    codemods.registerMiddleware('server', [
      {
        path: '@lensjs/adonis/lens_middleware',
      },
    ])
  } catch (error) {
    console.error(error)
  }
}

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  await registerEnvValidation(codemods)
  await registerMiddleware(codemods)
  await codemods.makeUsingStub(stubsRoot, 'config/lens.stub', {})
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@lensjs/adonis/lens_provider')
  })
}
