---
"@lensjs/core": patch
---

Fix detail tab groups not selecting a tab when the default tab has no data for
that entry (e.g. HTTP client details with no request headers). `TabbedDataViewer`
now always falls back to the first visible tab, so a tab is always active and its
content shown.
