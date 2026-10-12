---
'@viteval/core': patch
'viteval': patch
---

Preserve native Vitest hook failures and skipped cases in provider run outcomes,
case diagnostics, and JSON reports. Keep multi-project collection errors attached
to their own project and preserve omitted fields in partial tag updates.
