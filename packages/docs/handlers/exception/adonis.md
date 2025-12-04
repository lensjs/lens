# AdonisJS Exception Handler

This guide explains how to integrate Lens's exception watcher with your AdonisJS application to monitor and report exceptions.

## Configuration

Ensure the exception watcher is enabled in your `config/lens.ts` file. It is enabled by default, but you can explicitly set it:

```ts
import env from '#start/env'
import { defineConfig } from '@lensjs/adonis'

const lensConfig = defineConfig({
  // ... other options
  watchers: {
    exceptions: env.get('LENS_ENABLE_EXCEPTION_WATCHER', true), // Ensure this is true to enable exception watching
  },
})

export default lensConfig
```

## Integration

To integrate the exception watcher, you need to resolve the `watchExceptions` function from the service container within your `app/exceptions/handler.ts` file and call it in the `report` method. This allows Lens to capture and process exceptions.

```ts{28}
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Call watchExceptions to allow Lens to monitor this exception
    (await app.container.make('watchExceptions'))?.(error as Exception, ctx)

    return super.report(error, ctx)
  }
}
```
Once configured, Lens will automatically capture exceptions reported by your AdonisJS application.
