---
"@lensjs/adonis": patch
---

Fix a boot crash ("Cannot read properties of undefined (reading 'booted')") caused by eagerly importing `@adonisjs/core/services/emitter` at module load. The query watcher now uses the container-resolved emitter instance, so importing `@lensjs/adonis` during the config phase no longer initializes the emitter service too early.
