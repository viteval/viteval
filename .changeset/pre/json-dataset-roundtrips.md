---
'@viteval/core': patch
'@viteval/ui': patch
'viteval': patch
---

Persist undefined JSON dataset inputs and expected values as null so successful
writes remain readable across creation, appends, and replacement. Preserve
dataset filenames containing `.json` when listing them in the dashboard.
