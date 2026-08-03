---
"@lensjs/core": minor
"@lensjs/express": minor
"@lensjs/fastify": minor
"@lensjs/adonis": minor
---

Validate Lens configuration at boot with a single, aggregated, actionable error.

- New `assertValidConfig` (exported from `@lensjs/core`) checks the neutral `LensConfig` surface (`path`, `hiddenParams`, `storeQueueConfig`, `sampling`, `retention`, `alerts`) and throws one error listing every problem it finds.
- Each adapter runs it as it starts, so misconfigurations fail fast with a clear message instead of surfacing later.
