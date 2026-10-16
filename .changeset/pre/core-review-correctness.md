---
'@viteval/core': patch
'viteval': patch
---

Preserve legacy raw dataset filenames, including spaces and percent characters,
across CRUD operations without overwriting encoded-name collisions. Report suite
timings from native case diagnostics and return malformed judge prompts as error
Results. Resolve coverage blob paths correctly in checkouts with spaces.
