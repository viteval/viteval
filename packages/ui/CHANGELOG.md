# @viteval/ui

## 1.0.0-rc.1

### Major Changes

- 32037fc: Migrate the v1 dashboard from Next.js to TanStack Start and TanStack Router.

  ### Architecture
  - Replace Next.js App Router and standalone output with typed TanStack file routes and Vite client/server builds.
  - Serve bundled browser assets and Start SSR/API requests through a Node child process with a Hono bridge.
  - Preserve the public `createVitevalServer()` launcher API, project-root selection, automatic port selection, and default port 6274.
  - Keep existing dashboard and API URLs, persisted data formats, filtering, tagging, and inspection workflows.
  - Verify packed JavaScript/CSS delivery, SSR deep links, missing-page/resource behavior, and clean server shutdown.

  The existing theme, summary cards, charts, sortable tables, case diagnostics,
  suite history/source views, and dataset metadata remain available. URL-based
  filters and encoded detail identifiers continue to work through direct links
  and browser reloads.

### Minor Changes

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

### Patch Changes

- b5f66c0: Connect dashboard pagination, filtering, and sorting to complete server listings.
  Use exact suite identities for detail links and history, preserve omitted tag
  PATCH fields, and distinguish malformed datasets from missing files.
- d7e3780: Persist undefined JSON dataset inputs and expected values as null so successful
  writes remain readable across creation, appends, and replacement. Preserve
  dataset filenames containing `.json` when listing them in the dashboard.
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

## 1.0.0-rc.0

### Major Changes

- Migrate @viteval/ui from TanStack Start + Express to Next.js 16 + Hono + shadcn dashboard
  - Replace TanStack Start/Router with Next.js 16 App Router (standalone output)
  - Replace Express with Hono + @hono/node-server as production server wrapper
  - Replace header navigation with shadcn sidebar layout
  - Add dashboard home page with summary cards
  - Install all shadcn UI primitives via CLI
  - Replace @iconify/react with lucide-react
  - Add /api/results/[id] route for polling refresh
- a1f85a8: Upgrade all dependencies to latest, migrate to TypeScript 6, Vite 8, Vitest 4.1, and AI SDK 6

## 0.5.8

### Patch Changes

- 3c5d8d3: bugfix: fix issue with UI breaking CLI due to upgrades, fix NaN on view results

## 0.5.7

### Patch Changes

- 778e2ba: deps: update core packages to latest version

## 0.5.6

## 0.5.5

## 0.5.4

## 0.5.3

### Patch Changes

- d3a8019: Change the name to not just be "Markdown Viewer" but "Field Viewer"

## 0.5.2

### Patch Changes

- 99b8d5c: add ability to view the scores

## 0.5.1

## 0.5.0

### Minor Changes

- 4b2822a: add new UI for viewing the contents of a JSON object as markdown

## 0.4.3

### Patch Changes

- 5ad0932: fixed issue with types for datasets

## 0.4.2

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error

## 0.4.0

### Minor Changes

- 864c595: ## Viteval UI (beta)

  This release includes major improvements to the Viteval UI, including:
  - Adding a new `datasets` page to view and manage your evaluation datasets
  - Adding UI states to show when an evaluation is running and updating it as it runs/finishes
  - Cleaning up the UI for Results List and Result Detail pages
  - Adding better viewing experience for Result Detail page

## 0.3.2

## 0.3.1

## 0.1.0

### Minor Changes

- 8140eca: ## Eval Results UI (alpha)

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

## 0.0.1

### Patch Changes

- b8a4e92: ## UI [alpha]

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

  > [!CAUTION]
  > The UI is still in alpha and may not be fully functional, probably has a lot of bugs, and may have significant breaking changes in the future.
