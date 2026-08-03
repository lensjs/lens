---
"@lensjs/core": minor
"@lensjs/express": minor
---

Add request/trace sampling with error- and slow-biased always-on rules.

- New `sampling` config (`{ rate, alwaysOnErrors, alwaysOnSlowMs }`). Sampled-out requests buffer their entries and are only written if they error (5xx) or exceed the slow threshold — so a kept request keeps its correlated queries/logs too. Exceptions are always captured.
- Applied on Express, Hono, and Next.js (where the request context wraps the full request lifecycle). Exposed via `createSamplingState` / `finalizeSampling`; watchers now persist through a sampling-aware choke point.
