# @viteval/internal

## 1.0.0-rc.1

### Major Changes

- f862d31: Replace autoevals dependency with custom scorer implementations

  - Remove `autoevals` third-party dependency
  - Implement all 20 scorers in-house (deterministic, embedding, LLM-based)
  - Add Result-returning `runJudge` and `getEmbedding` helpers for AI SDK models
  - Add `isNumber` and `clamp` utilities to `@viteval/internal`
  - Simplify provider initialization by removing autoevals init workaround

### Minor Changes

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

## 1.0.0-rc.0

## 0.5.9

### Patch Changes

- a1f85a8: Upgrade all dependencies to latest, migrate to TypeScript 6, Vite 8, Vitest 4.1, and AI SDK 6

## 0.5.8

## 0.5.7

### Patch Changes

- 778e2ba: deps: update core packages to latest version

## 0.5.6

## 0.5.5

## 0.5.4

## 0.5.3

## 0.5.2

## 0.5.1

## 0.5.0

## 0.4.3

## 0.4.2

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error

## 0.4.0

## 0.3.2

### Patch Changes

- 9db42c7: # What's changed?
  - Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
  - Added a `createVitevalServer` for the `ui` that can be used in a more standard way/approach

## 0.3.1

### Patch Changes

- 94c3934: Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.

## 0.0.4

### Patch Changes

- 8c267d7: feat: Added `datasets` support for cacheing pre-generated datasets
- 62941f3: chore: General cleanup and better testing

## 0.0.3

## 0.0.2
