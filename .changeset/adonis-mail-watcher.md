---
"@lensjs/adonis": minor
---

Add mail watcher support to the AdonisJS adapter. When the `mail` watcher is enabled, Lens automatically captures emails sent via `@adonisjs/mail` by listening to the `mail:sent` event and correlates them to the originating request.
