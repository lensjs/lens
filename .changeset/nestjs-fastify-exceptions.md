---
"@lensjs/nestjs": patch
---

Capture exceptions when using the Fastify adapter. The exception watcher was force-disabled on the Fastify path, so thrown errors were never recorded even though the watcher was registered. Exceptions are now logged by the global `LensExceptionFilter` and correlated to the originating request; response handling is unchanged.
