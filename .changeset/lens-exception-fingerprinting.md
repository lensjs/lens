---
"@lensjs/core": minor
"@lensjs/express": minor
"@lensjs/fastify": minor
"@lensjs/nestjs": minor
"@lensjs/adonis": minor
---

Add exception fingerprinting/grouping and config-driven outbound alerting.

- Every exception now gets a stable `fingerprint` (from its type + originating file/function, with a normalized-message fallback) stored in `minimal_data`, so repeat errors collapse into one issue. The dashboard Exceptions page gains a "Group by issue" toggle (count + last seen) that drill-downs to a single issue's occurrences via the server-side `fingerprint` filter, backed by a new `GET /api/exceptions/groups` endpoint.
- New `alerts` config posts to Slack, Discord, or a generic webhook when a new exception issue is captured — deduped by fingerprint within a cooldown and delivered non-blocking (never throws into the app). Exposed as `createLensNotifier` from `@lensjs/core`; adapters forward the `alerts` option to core.
