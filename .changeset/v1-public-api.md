---
'@viteval/core': minor
'@viteval/cli': minor
'@viteval/providers': minor
'@viteval/ui': minor
'viteval': minor
---

Define the V1 public API with Viteval-owned configuration, worker-local model and
storage dependencies, and array-selected dataset/result destinations.

Use `viteval.config.ts`, raw AI SDK providers, and direct evaluation execution
options instead of native runner configuration or setup modules. Generate
datasets once across selected providers and choose evaluation read sources
independently. JSON result persistence produces dashboard-readable snapshots
without requiring a reporter. Integration imports contribute typed capabilities
and callback handles. Update init templates, examples, and documentation.

Own CLI commands and help, list evaluations without executing generators, tasks,
or scorers, honor CLI execution overrides, and close
provider resources after skipped or failed collection. Finalize healthy result
destinations after partial persistence failures and release timed-out evaluation
permits. Require V1 dataset and report envelopes throughout storage and the
dashboard.

Use separately generated SQLite and PostgreSQL clients for the optional database
provider, and serialize PostgreSQL schema initialization across connections.

Persist Langfuse and VoltOps upload completion journals so fresh readers reject
incomplete managed datasets, and clean up orphaned Braintrust datasets after
failed creation.

Preserve hosted dataset item metadata and skipped evaluation states, recover
abandoned local JSON locks without stealing live writers, and reuse custom scorer
factories within each project runtime.

Keep reporter adapters as internal factories, not public classes or runner APIs.
Remove legacy initialization functions, global model/provider fallbacks, and native
Vitest configuration compatibility. Public evaluations return no runner objects.
Use `--timeout`, `--concurrency`, `--retries`, and `--name` for evaluation overrides;
execute through internal programmatic runner primitives rather than CLI passthrough.
Discard datasets registered by failed imports even when another module catches the error.
