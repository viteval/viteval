# Provider: Mastra

> **Status:** complete
> **Website:** https://mastra.ai
> **npm:** `@mastra/core`
> **Priority:** low

## Overview

TypeScript AI framework with built-in eval, dataset management, and agent orchestration. Storage is via internal TypeScript interfaces (no public REST API). Cloud platform is in beta with no documented API access.

## TypeScript SDK

- **Package:** `@mastra/core/evals` (scorers), `@mastra/evals` (prebuilt scorers)
- **Auth:** No auth for local/self-hosted. Cloud is beta-only, no public API keys.
- **Base URL:** No public REST API.

## Concepts

| Viteval Concept | Mastra Equivalent    | Notes                                               |
| --------------- | -------------------- | --------------------------------------------------- |
| Dataset         | Dataset              | Versioned (SCD-2). Schema-aware, target-typed.      |
| DatasetItem     | Dataset Item         | `input`, `groundTruth`, `requestContext`.            |
| EvalRun         | Experiment           | `datasetId` + `targetId`. No name/tags/config.      |
| EvalResult      | Experiment Result    | `input`, `output`, `status`. No scores or duration.  |
| Score           | N/A (computed only)  | `runEvals` returns averages. Not persisted per-item. |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method                          | Supported | Notes                                                |
| ------------ | ---------------------------------------------- | --------- | ---------------------------------------------------- |
| `create()`   | `DatasetsStorage.createDataset()`              | Yes*      | Internal TS interface only. No REST API.             |
| `get()`      | `DatasetsStorage.getDatasetById()`             | Yes*      | Internal TS interface only.                          |
| `list()`     | `DatasetsStorage.listDatasets()`               | Yes*      | Page-based. Internal only.                           |
| `update()`   | `DatasetsStorage._doUpdateDataset()`           | Partial   | Protected method. Not part of public API.            |
| `delete()`   | `DatasetsStorage.deleteDataset()`              | Yes*      | Internal TS interface only.                          |
| `getItems()` | `DatasetsStorage.listItems()`                  | Yes*      | Supports version filter. Internal only.              |
| `addItems()` | `DatasetsStorage._doBatchInsertItems()`        | Yes*      | Protected method. Internal only.                     |

\* = Internal TypeScript storage interface, not a remote API. Same-process only.

## EvalProvider Mapping

| Method        | Endpoint / SDK Method                              | Supported | Notes                                                      |
| ------------- | -------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `create()`    | `ExperimentsStorage.createExperiment()`             | Yes*      | No name/tags/config — only `datasetId`, `targetId`.        |
| `get()`       | `ExperimentsStorage.getExperimentById()`            | Yes*      | Internal only.                                             |
| `list()`      | `ExperimentsStorage.listExperiments()`              | Yes*      | `datasetId` filter, pagination.                            |
| `addResult()` | `ExperimentsStorage.addExperimentResult()`          | Partial*  | No `scores`, `passed`, `duration` fields on their results. |
| `complete()`  | `ExperimentsStorage.updateExperiment()`             | Yes*      | Status: `pending | running | completed | failed`. Match.   |

## Gaps

### Things they support that we don't

- SCD-2 dataset versioning (`validTo`, `isDeleted` tracking)
- Target type association on datasets (agent/workflow/scorer binding)
- Review workflow on results (`needs-review → reviewed → complete`)
- Trajectory evaluation (step-by-step execution traces)
- Live/sampled scoring in production with configurable sample rates
- Input/groundTruth/requestContext JSON schemas on datasets

### Things we support that they don't

- Pre-computed per-item scores (Mastra only stores averages from `runEvals`)
- `passed` boolean per result
- `duration` per result
- Run-level `name`, `tags`, `config`, `metadata`
- Public REST API for remote access

## Integration Notes

- **No REST API.** All storage operations are internal TypeScript interfaces backed by SQLite (`@mastra/libsql`). A provider integration would need to embed Mastra storage in-process, not call a remote API.
- **Per-item scores not persisted.** `runEvals` computes and returns average scores but doesn't persist per-item breakdowns. `ExperimentResult` has no `scores` field.
- **`addResult()` mismatch.** Their result model stores `input`, `output`, `error`, `status` — not `scores`, `passed`, or `duration`. We'd lose score data.
- **Integration path:** Embed `@mastra/libsql` storage adapter directly, wrapping `DatasetsStorage` / `ExperimentsStorage`. But this creates a tight coupling and doesn't support remote Mastra Cloud.

## Sources

- [Mastra Docs](https://mastra.ai/docs)
- [Evals Guide](https://mastra.ai/docs/evals/overview)
- [Evals — Running Evals](https://mastra.ai/docs/evals/running-evals)
- [GitHub — mastra](https://github.com/mastra-ai/mastra)
- [npm — @mastra/core](https://www.npmjs.com/package/@mastra/core)
- [npm — @mastra/evals](https://www.npmjs.com/package/@mastra/evals)

## Verdict

The internal TypeScript interfaces map structurally to ours, but the lack of a public REST API makes this a **same-process-only integration**. Per-item score storage is missing. Mastra Cloud is beta with no programmatic access. **Low priority — wait for their Cloud API to mature before investing in a provider.**
