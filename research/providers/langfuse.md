# Provider: Langfuse

> **Status:** complete
> **Website:** https://langfuse.com
> **npm:** `langfuse`
> **Priority:** high

## Overview

Open-source LLM observability and eval platform. Tracing, datasets, experiments, scoring. Self-hostable. Strong community adoption. TypeScript SDK via `langfuse` npm package.

## TypeScript SDK

- **Package:** `langfuse` (client: `@langfuse/client` internal)
- **Auth:** HTTP Basic Auth — username = Public Key, password = Secret Key
- **Base URL:** `https://cloud.langfuse.com/api/public` (EU), `https://us.cloud.langfuse.com/api/public` (US), or self-hosted

## Concepts

| Viteval Concept | Langfuse Equivalent      | Notes                                                 |
| --------------- | ------------------------ | ----------------------------------------------------- |
| Dataset         | Dataset                  | Named, versioned, with optional JSON Schema.          |
| DatasetItem     | Dataset Item             | `input`, `expectedOutput`, `metadata`.                |
| EvalRun         | Dataset Run              | Implicit — created when first item is linked.         |
| EvalResult      | Trace + Dataset Run Item | Result = trace linked to run item. Not a flat record. |
| Score           | Score                    | Separate entity. `NUMERIC`, `CATEGORICAL`, `BOOLEAN`. |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method                | Supported | Notes                                             |
| ------------ | ------------------------------------ | --------- | ------------------------------------------------- |
| `create()`   | `POST /api/public/v2/datasets`       | Yes       | Name-idempotent (upsert by name).                 |
| `get()`      | `GET /api/public/v2/datasets/{name}` | Yes       | By name only, not by ID.                          |
| `list()`     | `GET /api/public/v2/datasets`        | Yes       | Page-based pagination, not offset.                |
| `update()`   | N/A                                  | No        | No dedicated update endpoint. Upsert creates new. |
| `delete()`   | N/A                                  | No        | No delete endpoint in public API.                 |
| `getItems()` | `GET /api/public/dataset-items`      | Yes       | Filter by `datasetName`, page-based.              |
| `addItems()` | `POST /api/public/dataset-items`     | Yes       | One at a time. Upsert via `id`.                   |

## EvalProvider Mapping

| Method        | Endpoint / SDK Method                            | Supported | Notes                                                            |
| ------------- | ------------------------------------------------ | --------- | ---------------------------------------------------------------- |
| `create()`    | N/A                                              | No        | Runs are implicit — created when first item is linked.           |
| `get()`       | `GET /api/public/datasets/{name}/runs/{runName}` | Yes       | Keyed by `(datasetName, runName)` string pair, not UUID.         |
| `list()`      | `GET /api/public/datasets/{name}/runs`           | Partial   | Only filter by dataset. No status/tags/cross-dataset listing.    |
| `addResult()` | `POST /dataset-run-items` + `POST /scores`       | Yes\*     | Two-step: link trace to run item, then attach scores separately. |
| `complete()`  | N/A                                              | No        | No run lifecycle. Runs are implicit groupings.                   |

## Gaps

### Things they support that we don't

- Dataset versioning (timestamp-based historical snapshots)
- Score configs (predefined schemas with min/max or allowed categories)
- Source tracking on items (linked to `sourceTraceId` / `sourceObservationId`)
- Folder organization (slash-notation paths)
- Session-level and observation-level scoring
- Run-level aggregate evaluators (one score per run)

### Things we support that they don't

- Explicit run creation and lifecycle (`create()`, `complete()`)
- Run status field (`running`, `completed`, `failed`)
- Run filtering by status and tags
- Dataset delete and update
- Atomic `addResult()` (single call with scores embedded)
- `passed` boolean and `duration` on results

## Integration Notes

- **Trace-centric model.** `addResult()` requires: (1) create a trace with input/output, (2) link trace to dataset run item via `POST /dataset-run-items`, (3) create score(s) via `POST /scores`. Three API calls minimum per result.
- **`create()` is a no-op.** Runs materialize implicitly. The adapter would store the run name and use it when linking items.
- **`complete()` is a no-op.** No lifecycle to finalize.
- **Dataset delete/update require workarounds** or are simply unsupported.
- **Run identification.** Uses `(datasetName, runName)` composite key, not a UUID. Adapter must map our `id` to this pair.

## Sources

- [API Reference](https://langfuse.com/docs/api)
- [Datasets Guide](https://langfuse.com/docs/datasets)
- [Scores Guide](https://langfuse.com/docs/scores)
- [TypeScript SDK](https://langfuse.com/docs/sdk/typescript)
- [Experiments Guide](https://langfuse.com/docs/datasets/overview#experiments)
- [REST API Reference (Fern)](https://api.reference.langfuse.com/)
- [GitHub — langfuse-js](https://github.com/langfuse/langfuse-js)

## Verdict

DatasetProvider is a decent match — create, get, list, getItems, addItems all work. Missing delete and update. EvalProvider has a deep architectural mismatch — their trace-centric, implicit-run model requires multi-call stitching for every `addResult()` and no-ops for `create()`/`complete()`. Implementable but requires careful adapter logic. **High priority due to popularity and open-source nature.**
