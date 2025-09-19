# NestJs Exception Handler

This guide explains how to integrate Lens's exception watcher with your NestJs application to monitor and report exceptions.

## Configuration

First, ensure the `exceptionWatcherEnabled` option is set to `true` when initializing Lens. This option is enabled by default, but it's good practice to confirm its status in your configuration:

```ts
await lens({
  // ... other options
  exceptionWatcherEnabled: true, // Ensure this is true to enable exception watching
});
```
## Verification

To verify that the exception handler is working correctly, you can intentionally throw an exception in one of your routes:

```ts
import { Controller, Get, HttpException } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/error')
  throwError() {
    throw new HttpException('This is an error', 400);
  }
}
```

After triggering this route, navigate to the Lens `/exceptions` path in your browser, and you should see the details of the captured exception.
