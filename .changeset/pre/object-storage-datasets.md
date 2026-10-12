---
'@viteval/providers': minor
---

Add optional S3 and Google Cloud Storage dataset providers with lazy SDK loading.
Publish immutable dataset snapshots through a conditionally updated catalog to
support CRUD, concurrent item additions, and atomic replacement. Preserve retained
versions and surface uncertain write outcomes without replaying mutations.

Use ETag conditions for S3, generation conditions for GCS, and protect GCS checksum
cleanup with the same write preconditions. Add real SDK HTTP contract tests for
concurrency, publication failures, and retained data.
