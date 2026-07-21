---
"@lensjs/fastify": patch
---

Fix requests hanging when a route throws. The adapter's Fastify error handler logged the exception but never produced a response, leaving the request open until it timed out. It now returns Fastify's default error response after logging, so thrown errors are both captured by the exception watcher and answered with a proper HTTP error.
