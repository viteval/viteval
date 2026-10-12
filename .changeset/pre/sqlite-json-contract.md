---
'@viteval/providers': patch
---

Use the shared strict JSON serializer for SQLite dataset and evaluation payloads.
Normalize undefined inputs, expected values, and outputs to null, and reject
non-finite numbers and unsupported objects before committing lossy data. Failed
dataset replacements and result batches preserve previously stored records.
