# viteval

## 1.0.0-rc.3

### Patch Changes

- 2340b27: Verify tokenless trusted publishing and installed registry packages across the aligned RC release.
- Updated dependencies [2340b27]
  - @viteval/cli@1.0.0-rc.3
  - @viteval/core@1.0.0-rc.3

## 1.0.0-rc.2

### Patch Changes

- 1f761f4: Preserve legacy raw dataset filenames, including spaces and percent characters,
  across CRUD operations without overwriting encoded-name collisions. Report suite
  timings from native case diagnostics and return malformed judge prompts as error
  Results. Resolve coverage blob paths correctly in checkouts with spaces.
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
- 29ac481: Preserve nested table controls, render grouped-column rows with correct spans,
  and confine truncation to data tables. Correct cross-platform file detection,
  unknown provider badges, JSON scalar rendering, selected object fields, calendar
  opening months, and validation of persisted UI settings.
- 6c995f6: Keep copied and hand-edited dataset files addressable by their filenames while
  preserving canonical provider IDs. Validate tag and tagging POST bodies before
  calling storage, and resolve the UI test alias through platform-safe file URLs.
- Updated dependencies [1f761f4]
- Updated dependencies [5c6ab66]
- Updated dependencies [d72a370]
- Updated dependencies [29ac481]
- Updated dependencies [6c995f6]
  - @viteval/core@1.0.0-rc.2
  - @viteval/cli@1.0.0-rc.2

## 1.0.0-rc.1

### Major Changes

- 7cda487: Convert all scorers to configurable factory functions

  - **BREAKING**: All scorers are now factory functions that must be called: `scorers.exactMatch()` instead of `scorers.exactMatch`
  - Deterministic scorers accept typed options: `exactMatch({ caseSensitive, trim })`, `levenshtein({ threshold })`, `numericDiff({ tolerance })`, `jsonDiff({ threshold })`, `listContains({ threshold })`
  - LLM scorers accept per-scorer model overrides: `scorers.answerCorrectness({ model: openai('gpt-4o') })`
  - `createJudgeScorer` now returns a factory `(options?) => Scorer` instead of a bare `Scorer`
  - Update all examples to use factory call syntax

  Closes #36

- 81e6d77: Replace OpenAI SDK with Vercel AI SDK for provider-agnostic model support

  - **BREAKING**: Remove `openai` dependency, add `ai` (Vercel AI SDK) as the provider abstraction
  - **BREAKING**: `VitevalProviderConfig` now accepts `model` (LanguageModel) and optional `embeddingModel` (EmbeddingModel) instead of `openai` config
  - **BREAKING**: Remove automatic `OPENAI_API_KEY` env var detection — users must explicitly configure a provider
  - Replace `requireClient()` / `getClient()` with Result-returning `requireModel()` / `requireEmbeddingModel()`
  - Rewrite `runJudge` to use `generateObject()` from AI SDK and return a `Result`
  - Rewrite `getEmbedding` to use `embed()` from AI SDK and return a `Result`
  - Convert `moderation` scorer from OpenAI moderation API to LLM judge (now provider-agnostic)
  - Export Result-returning `initializeProvider()` from public API for setup file usage
  - Users can now use any AI SDK-compatible provider: OpenAI, Anthropic, Google, Mistral, etc.

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

- 92023da: Delegate configuration, discovery, execution, and reporting to Vitest 5's public APIs.

  - **BREAKING**: Replace `viteval.config.ts` and the `eval` configuration block with native `vitest.config.ts` and `test` options.
  - **BREAKING**: Remove the custom runner, plugin, runtime bootstrap, virtual config module, `createRun()` lifecycle, and `@viteval/core/runner` and `@viteval/core/plugin` exports.
  - **BREAKING**: Delegate evaluation CLI parsing and lifecycle to Vitest, replace `Eval.timeout` with native `Eval.testOptions`, and remove `createDefaultReporter()` in favor of Vitest's built-in default reporter.
  - **BREAKING**: Rewrite `JsonReporter` with Vitest's granular lifecycle hooks. Custom reporters extending the old `onFinished(files)` API must migrate.
  - Execute evaluations through Vitest's native `start()` API.
  - Transport structured eval results as typed Vitest custom artifacts.
  - Initialize non-serializable models and providers through native Vitest setup files.
  - Add a native custom reporter that uses evaluation terminology throughout.
  - Add test annotations (`context.annotate`) for inline score reporting.
  - Eliminate all `DangerouslyAllowAny` and `as any` casts from the core package.

### Minor Changes

- 7f3ba21: Decouple task return type from expected type in evaluations

  - `Scorer`, `ScorerArgs`, and `createScorer` now accept separate `OUTPUT` and `EXPECTED` type parameters (defaults preserve backward compat)
  - `Eval` and `evaluate()` infer `TASK_OUTPUT` from the task function independently of the data's expected type
  - Scorers receive `output: TASK_OUTPUT` and `expected: EXPECTED` as distinct types
  - Add `wrapScorer()` utility to adapt existing scorers for mismatched types via `output`/`expected` mapping functions
  - Fix prebuilt scorer return types for the new type parameter ordering

  Closes #110

- a1627e4: Use maltty for project commands, terminal prompts, logging, and dataset progress.
  Add an optional compiled command shell while preserving native Vitest execution
  and CLI exit codes.
- 878f3d5: Add provider abstraction for datasets and eval runs with built-in Braintrust support

  - Add `Provider`, `DatasetProvider`, and `EvalProvider` interfaces to `@viteval/core`
  - Add `@viteval/providers` package with scoped provider implementations
  - Built-in `viteval()` provider using SQLite (default) or PostgreSQL via Prisma
  - Built-in `braintrust()` provider using `@braintrust/api` (optional peer dep)
  - Auto-inject default SQLite provider in `defineConfig()` when no provider is specified
  - Support composable providers (mix different providers for datasets vs evals)
  - Auto-persist eval results when a provider is configured
  - Add `addResults` batch method on `EvalProvider` for providers supporting bulk insert

- de505ac: Add `sampleItems` utility for generating N dataset items from a single factory function

  - `sampleItems({ item, count })` returns a `Result<DataGenerator>` so invalid counts are represented without throwing
  - Items are generated sequentially to respect rate limits on LLM calls
  - Validates that `count >= 1`

  Closes #38

### Patch Changes

- 77730d8: Initialize dataset discovery before user setup modules so setup-imported inline
  datasets are generated once without collecting evaluation work. Preserve
  Braintrust dataset metadata through the SDK's supported update operation.
- a4d1952: Preserve native Vitest hook failures and skipped cases in provider run outcomes,
  case diagnostics, and JSON reports. Keep multi-project collection errors attached
  to their own project and preserve omitted fields in partial tag updates.
- d7e3780: Persist undefined JSON dataset inputs and expected values as null so successful
  writes remain readable across creation, appends, and replacement. Preserve
  dataset filenames containing `.json` when listing them in the dashboard.
- d7e3780: Exclude skipped native evaluation cases from provider score summaries while
  preserving their recorded outcomes and total counts. Read scorer configuration
  from an executed case when the first native case is skipped.
- Updated dependencies [7cda487]
- Updated dependencies [7f3ba21]
- Updated dependencies [77730d8]
- Updated dependencies [a4d1952]
- Updated dependencies [d7e3780]
- Updated dependencies [a1627e4]
- Updated dependencies [d7e3780]
- Updated dependencies [81e6d77]
- Updated dependencies [878f3d5]
- Updated dependencies [f862d31]
- Updated dependencies [de505ac]
- Updated dependencies [e8837f8]
- Updated dependencies [a1627e4]
- Updated dependencies [92023da]
  - @viteval/core@1.0.0-rc.1
  - @viteval/cli@1.0.0-rc.1

## 1.0.0-rc.0

### Patch Changes

- Updated dependencies
  - @viteval/ui@1.0.0-rc.0
  - @viteval/cli@1.0.0-rc.0
  - @viteval/core@1.0.0-rc.0
  - @viteval/internal@1.0.0-rc.0

## 0.5.9

### Patch Changes

- a1f85a8: Upgrade all dependencies to latest, migrate to TypeScript 6, Vite 8, Vitest 4.1, and AI SDK 6
- Updated dependencies [a1f85a8]
  - @viteval/core@0.5.9
  - @viteval/cli@0.5.9
  - @viteval/internal@0.5.9
  - @viteval/ui@0.5.9

## 0.5.8

### Patch Changes

- 3c5d8d3: bugfix: fix issue with UI breaking CLI due to upgrades, fix NaN on view results
- Updated dependencies [3c5d8d3]
  - @viteval/ui@0.5.8
  - @viteval/cli@0.5.8
  - @viteval/core@0.5.8
  - @viteval/internal@0.5.8

## 0.5.7

### Patch Changes

- 778e2ba: deps: update core packages to latest version
- Updated dependencies [778e2ba]
  - @viteval/internal@0.5.7
  - @viteval/core@0.5.7
  - @viteval/cli@0.5.7
  - @viteval/ui@0.5.7

## 0.5.6

### Patch Changes

- Updated dependencies [73db907]
  - @viteval/cli@0.5.6
  - @viteval/core@0.5.6
  - @viteval/internal@0.5.6
  - @viteval/ui@0.5.6

## 0.5.5

### Patch Changes

- f44eff9: fix: bad shebang in CLI
- Updated dependencies [f44eff9]
  - @viteval/cli@0.5.5
  - @viteval/core@0.5.5
  - @viteval/internal@0.5.5
  - @viteval/ui@0.5.5

## 0.5.4

### Patch Changes

- 6ce6275: fix: Add shebang to make sure executable using node and update docs to show the correct init
- Updated dependencies [7e85743]
  - @viteval/core@0.5.4
  - @viteval/cli@0.5.4
  - @viteval/internal@0.5.4
  - @viteval/ui@0.5.4

## 0.5.3

### Patch Changes

- Updated dependencies [d3a8019]
  - @viteval/ui@0.5.3
  - @viteval/cli@0.5.3
  - @viteval/core@0.5.3
  - @viteval/internal@0.5.3

## 0.5.2

### Patch Changes

- Updated dependencies [b344023]
- Updated dependencies [99b8d5c]
  - @viteval/cli@0.5.2
  - @viteval/ui@0.5.2
  - @viteval/core@0.5.2
  - @viteval/internal@0.5.2

## 0.5.1

### Patch Changes

- Updated dependencies [6cf2472]
- Updated dependencies [6e0cc43]
- Updated dependencies [1105e91]
  - @viteval/cli@0.5.1
  - @viteval/core@0.5.1
  - @viteval/internal@0.5.1
  - @viteval/ui@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [4b2822a]
  - @viteval/ui@0.5.0
  - @viteval/cli@0.5.0
  - @viteval/core@0.5.0
  - @viteval/internal@0.5.0

## 0.4.3

### Patch Changes

- Updated dependencies [5ad0932]
  - @viteval/core@0.4.3
  - @viteval/ui@0.4.3
  - @viteval/cli@0.4.3
  - @viteval/internal@0.4.3

## 0.4.2

### Patch Changes

- a179bd1: stablize the datasets, add support for memory, and better CLI handling for datasets
- Updated dependencies [a179bd1]
  - @viteval/core@0.4.2
  - @viteval/cli@0.4.2
  - @viteval/internal@0.4.2
  - @viteval/ui@0.4.2

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error
- Updated dependencies [71ee1af]
  - @viteval/cli@0.4.1
  - @viteval/core@0.4.1
  - @viteval/internal@0.4.1
  - @viteval/ui@0.4.1

## 0.4.0

### Minor Changes

- 864c595: ## Viteval UI (beta)

  This release includes major improvements to the Viteval UI, including:
  - Adding a new `datasets` page to view and manage your evaluation datasets
  - Adding UI states to show when an evaluation is running and updating it as it runs/finishes
  - Cleaning up the UI for Results List and Result Detail pages
  - Adding better viewing experience for Result Detail page

### Patch Changes

- Updated dependencies [864c595]
  - @viteval/core@0.4.0
  - @viteval/cli@0.4.0
  - @viteval/ui@0.4.0
  - @viteval/internal@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [9db42c7]
  - @viteval/internal@0.3.2
  - @viteval/core@0.3.2
  - @viteval/cli@0.3.2
  - @viteval/ui@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [94c3934]
  - @viteval/internal@0.3.1
  - @viteval/core@0.3.1
  - @viteval/cli@0.3.1
  - @viteval/ui@0.3.1

## 0.2.0

### Minor Changes

- 8140eca: ## Eval Results UI (alpha)

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

### Patch Changes

- Updated dependencies [8140eca]
  - @viteval/core@0.2.0
  - @viteval/cli@0.3.0
  - @viteval/ui@0.1.0

## 0.1.9

### Patch Changes

- Updated dependencies [b8a4e92]
  - @viteval/core@0.1.8
  - @viteval/cli@0.2.4

## 0.1.8

### Patch Changes

- Updated dependencies [ba9db56]
  - @viteval/core@0.1.7
  - @viteval/cli@0.2.3

## 0.1.7

### Patch Changes

- Updated dependencies [56cf589]
  - @viteval/core@0.1.6
  - @viteval/cli@0.2.2

## 0.1.6

### Patch Changes

- Updated dependencies [f42a1cc]
  - @viteval/core@0.1.5
  - @viteval/cli@0.2.1

## 0.1.5

### Patch Changes

- Updated dependencies [4ddfa01]
  - @viteval/cli@0.2.0
  - @viteval/core@0.1.4

## 0.1.4

### Patch Changes

- Updated dependencies [ee6f429]
  - @viteval/cli@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [7e7bd69]
- Updated dependencies [d99658c]
  - @viteval/core@0.1.3
  - @viteval/cli@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [5d1186d]
- Updated dependencies [ae4035e]
  - @viteval/core@0.1.2
  - @viteval/cli@0.1.2

## 0.1.1

### Patch Changes

- 98365f5: fix: Fix the runner so it can find underlying lib
- Updated dependencies [98365f5]
  - @viteval/core@0.1.1
  - @viteval/cli@0.1.1

## 0.1.0

### Minor Changes

- 8c267d7: feat: Added `datasets` support for cacheing pre-generated datasets

### Patch Changes

- 62941f3: "feat: expose `createScorer` & general clean up"
- Updated dependencies [8c267d7]
- Updated dependencies [62941f3]
- Updated dependencies [1cc67b1]
- Updated dependencies [62941f3]
  - @viteval/core@0.1.0
  - @viteval/cli@0.1.0

## 0.0.3

### Patch Changes

- ce74986: feat: Add `resolve` config support and attempt to fix plugin support
- Updated dependencies [ce74986]
  - @viteval/core@0.0.3
  - @viteval/cli@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [f9d3314]
  - @viteval/core@0.0.2
  - @viteval/cli@0.0.2
