# @viteval/providers

## 1.0.0-rc.6

### Patch Changes

- 780fb20: Replace custom numeric, aggregation, metadata, and deduplication helpers with massaman utilities while preserving evaluation defaults.
- Updated dependencies [780fb20]
  - @viteval/core@1.0.0-rc.6
  - @viteval/internal@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- @viteval/core@1.0.0-rc.5
  - @viteval/internal@1.0.0-rc.5

## 1.0.0-rc.4

### Minor Changes

- ccde266: Define the V1 public API with Viteval-owned configuration, worker-local model and
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

  Separate case execution, dataset resolution, and persistence from the internal
  Vitest adapter. Scope project dependencies to each evaluation file, preserve them
  through deferred collection, and share provider cleanup across concurrent callers.
  Resolve generated discovery imports from the installed CLI so isolated pnpm
  consumers do not need direct dependencies on internal packages.

### Patch Changes

- Updated dependencies [ccde266]
  - @viteval/core@1.0.0-rc.4
  - @viteval/internal@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- 2340b27: Verify tokenless trusted publishing and installed registry packages across the aligned RC release.
- Updated dependencies [2340b27]
  - @viteval/core@1.0.0-rc.3
  - @viteval/internal@1.0.0-rc.3

## 1.0.0-rc.2

### Patch Changes

- 5c6ab66: Normalize dataset discovery identifiers across platforms and align generated env
  paths and configuration templates, including ESM-compatible configs for CommonJS
  projects. Isolate Langfuse run history by decoded run
  identity and supported API filters, resolve one SDK/exporter host, roll back
  failed Braintrust dataset creation when possible, and stabilize VoltOps dataset
  item hashes. Diagnose incomplete VoltOps upload versions and document snapshot
  retention and legacy database tagging capability limits.
- d72a370: Ship the reviewed v1 RC fixes for legacy JSON dataset identities and lock recovery,
  native reporter timing, setup-file generation, hosted provider failure handling,
  dashboard value rendering, and dataset API validation. Preserve the complete
  navigation regression checks on coverage-instrumented CI runners.
- Updated dependencies [1f761f4]
- Updated dependencies [d72a370]
  - @viteval/core@1.0.0-rc.2
  - @viteval/internal@1.0.0-rc.2

## 1.0.0-rc.1

### Major Changes

- e8837f8: Add polymorphic tag/tagging system for human labeling

  ### Core (`@viteval/core`)
  - New `TagProvider` sub-interface with `list/create/update/delete` and `addTagging/removeTagging/listTaggings/listEntitiesForTag` ops
  - New types: `StoredTag`, `StoredTagging`, `TagEntityType` (`'eval_run' | 'eval_result' | 'dataset' | 'dataset_item'`)
  - `Provider.tags?: TagProvider` and `ProviderConfig` `{ tags? }` slot
  - `getTagProvider()` / `requireTagProvider()` runtime accessors and `__viteval_tagProvider` global

  ### Providers (`@viteval/providers`)
  - `viteval` provider exposes a Prisma-backed `TagProvider` (SQLite default, Postgres optional)
  - New `Tag` + `Tagging` Prisma models with polymorphic `(entityType, entityId)` reference and unique `(tagId, entityType, entityId)` constraint
  - Raw-SQL `ensureSchema()` updated with matching `tags` + `taggings` table creates and indexes

  ### UI (`@viteval/ui`)
  - Tags stored in `.viteval/tags.json` + `.viteval/taggings.json` (FS-only for v1; provider DB sync deferred)
  - New SDK resource `viteval.tags` mirroring the core `TagProvider` shape
  - API routes: `GET/POST /api/tags`, `PATCH/DELETE /api/tags/[id]`, `POST/DELETE /api/taggings`, `POST /api/taggings/lookup`
  - New components in `@/components/tag`: `TagChip`, `TagPicker`, `TagList`, `useTags` hook
  - Tag editor on results detail and dataset detail pages
  - "Tags" column added to results and datasets tables (display chips, batch-loaded once per render)

  ### Breaking changes
  - `EvalRun.tags` column dropped from Prisma schema. Existing runs lose their string-array tags; re-tag via the new system after upgrading
  - `StoredEvalRun.tags`, `CreateEvalRunParams.tags`, `ListEvalRunsParams.tags` removed — apply tags via `TagProvider.addTagging({ entityType: 'eval_run', entityId })` instead
  - `Braintrust` provider no longer writes/reads `_viteval_tags` metadata or filters by tags

- a1627e4: Complete the local-first v1 workflow with JSON provider storage, atomic writes,
  native-worker dataset generation, execution diagnostics, optional SQLite and
  Braintrust persistence, dashboard validation, and isolated packed-package checks.

  JSON is now the default native provider. SQLite requires an explicit database
  option. Tasks receive input and extra fields; expected answers are reserved for
  scorers. All packages require Node 26 or newer.

  Preserve renamed JSON datasets when names are reused, serialize concurrent
  namespace changes, and retain authoritative outcomes in dashboard projections.
  Dashboard reads preserve dataset identifiers and extra fields, expose skipped
  counts, and report tag-storage failures. Add repeatable browser verification and
  merged native-worker coverage reporting.

  Discover default, named, and inline datasets in dataset and evaluation modules
  without executing evaluation tasks or scorers. Deduplicate aliases and shared
  re-exports, reject duplicate names, and report module import failures before
  publishing their datasets.

### Minor Changes

- a1627e4: Add opt-in Langfuse and hosted VoltOps providers with lazy official SDK loading,
  dataset reads/uploads, hosted case outcomes, and explicit SDK capability errors.
  Langfuse uses v4 OpenTelemetry ingestion and supports completed-run history;
  VoltOps registers scorers, uploads batches, and completes non-auto-queued runs.

  Make Prisma and SQLite drivers optional peers. JSON-only consumers no longer
  install native database dependencies; SQLite users install its client and driver
  packages explicitly.

- a1627e4: Add optional S3 and Google Cloud Storage dataset providers with lazy SDK loading.
  Publish immutable dataset snapshots through a conditionally updated catalog to
  support CRUD, concurrent item additions, and atomic replacement. Preserve retained
  versions and surface uncertain write outcomes without replaying mutations.

  Use ETag conditions for S3, generation conditions for GCS, and protect GCS checksum
  cleanup with the same write preconditions. Add real SDK HTTP contract tests for
  concurrency, publication failures, and retained data.

- 878f3d5: Add provider abstraction for datasets and eval runs with built-in Braintrust support

  - Add `Provider`, `DatasetProvider`, and `EvalProvider` interfaces to `@viteval/core`
  - Add `@viteval/providers` package with scoped provider implementations
  - Built-in `viteval()` provider using SQLite (default) or PostgreSQL via Prisma
  - Built-in `braintrust()` provider using `@braintrust/api` (optional peer dep)
  - Auto-inject default SQLite provider in `defineConfig()` when no provider is specified
  - Support composable providers (mix different providers for datasets vs evals)
  - Auto-persist eval results when a provider is configured
  - Add `addResults` batch method on `EvalProvider` for providers supporting bulk insert

### Patch Changes

- 77730d8: Initialize dataset discovery before user setup modules so setup-imported inline
  datasets are generated once without collecting evaluation work. Preserve
  Braintrust dataset metadata through the SDK's supported update operation.
- d7e3780: Use the shared strict JSON serializer for SQLite dataset and evaluation payloads.
  Normalize undefined inputs, expected values, and outputs to null, and reject
  non-finite numbers and unsupported objects before committing lossy data. Failed
  dataset replacements and result batches preserve previously stored records.
- Updated dependencies [7cda487]
- Updated dependencies [7f3ba21]
- Updated dependencies [a4d1952]
- Updated dependencies [d7e3780]
- Updated dependencies [d7e3780]
- Updated dependencies [81e6d77]
- Updated dependencies [878f3d5]
- Updated dependencies [f862d31]
- Updated dependencies [de505ac]
- Updated dependencies [e8837f8]
- Updated dependencies [a1627e4]
- Updated dependencies [92023da]
  - @viteval/core@1.0.0-rc.1
  - @viteval/internal@1.0.0-rc.1
