---
'@viteval/core': patch
'viteval': patch
---

Exclude skipped native evaluation cases from provider score summaries while
preserving their recorded outcomes and total counts. Read scorer configuration
from an executed case when the first native case is skipped.
