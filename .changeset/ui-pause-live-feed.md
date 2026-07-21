---
"@lensjs/core": minor
---

Add a live feed with a pause/resume toggle to the dashboard (Telescope-style). List views (requests, queries, cache, exceptions, mail) now poll for newly-captured entries and prepend them automatically. A "Live/Paused" control in the header stops and resumes the live updates; the choice is persisted across reloads. Pausing only affects the UI feed — the server keeps recording.
