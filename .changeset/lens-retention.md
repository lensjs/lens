---
"@lensjs/core": minor
---

Add age-based retention policies that purge entries older than a max age, per signal type.

- New `storeQueueConfig.retention` (`{ defaultMaxAgeMs, perType, sweepIntervalMs }`); a `RetentionStore` mixin sweeps on an interval for both the SQLite and SQL stores, complementing the existing size-based pruning.
- Adds `Store.pruneOlderThan(cutoffISO, type?)` (a default no-op, implemented by the built-in stores) — additive, so custom stores keep working.
