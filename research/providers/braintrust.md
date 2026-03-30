# Provider: Braintrust

> **Status:** complete
> **Website:** https://www.braintrust.dev
> **npm:** `braintrust`
> **Priority:** high

## Overview

Full-featured LLM eval platform. Experiments, datasets, production logging, prompt management. Strong TypeScript SDK. Everything scoped under Projects.

## TypeScript SDK

- **Package:** `braintrust`
- **Auth:** Bearer token via `BRAINTRUST_API_KEY` env var or `login({ apiKey })`
- **Base URL:** `https://api.braintrust.dev/v1`

## Concepts

| Viteval Concept | Braintrust Equivalent | Notes                                              |
| --------------- | --------------------- | -------------------------------------------------- |
| Dataset         | Dataset               | Direct match. Requires `project_id`.               |
| DatasetItem     | Dataset Event         | `input`, `expected`, `metadata`, `tags`            |
| EvalRun         | Experiment            | No status lifecycle. Implicitly complete.          |
| EvalResult      | Experiment Event      | `input`, `output`, `expected`, `scores`, `metrics` |
| Score           | `scores` object       | Key-value, values 0-1.                             |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method           | Supported | Notes                                           |
| ------------ | ------------------------------- | --------- | ----------------------------------------------- |
| `create()`   | `POST /v1/dataset`              | Yes       | `project_id` required. Items added separately.  |
| `get()`      | `GET /v1/dataset?dataset_name=` | Yes       | By name filter on list. No `GET /{id}` in docs. |
| `list()`     | `GET /v1/dataset`               | Yes       | Cursor-based pagination, not offset.            |
| `update()`   | Unclear                         | Partial   | SDK `update()` operates on rows, not metadata.  |
| `delete()`   | `DELETE /v1/dataset/{id}`       | Likely    | Referenced but not fully documented.            |
| `getItems()` | `GET /v1/dataset/{id}/fetch`    | Yes       | Cursor pagination.                              |
| `addItems()` | `POST /v1/dataset/{id}/insert`  | Yes       | Batch insert. Returns `row_ids[]`.              |

## EvalProvider Mapping

| Method        | Endpoint / SDK Method             | Supported | Notes                                           |
| ------------- | --------------------------------- | --------- | ----------------------------------------------- |
| `create()`    | `POST /v1/experiment`             | Yes       | `project_id` required. No status field.         |
| `get()`       | `GET /v1/experiment/{id}`         | Yes       | Results via separate `/fetch` endpoint.         |
| `list()`      | `GET /v1/experiment`              | Partial   | No tag/status/datasetId server-side filters.    |
| `addResult()` | `POST /v1/experiment/{id}/insert` | Yes       | Batch events. Duration → `metrics.start/end`.   |
| `complete()`  | N/A                               | No        | No explicit complete. `summarize` is read-only. |

## Gaps

### Things they support that we don't

- `repo_info` — git commit/branch/diff for reproducibility
- `base_exp_id` — baseline experiment for comparison
- Span/trace hierarchy within experiment events
- `metrics` object with token counts, latency breakdowns
- `dataset_version` pinning on experiments
- BTQL query language for analytics
- `_is_merge` partial update semantics

### Things we support that they don't

- Explicit run status lifecycle (`running` → `completed` / `failed`)
- Server-side tag/status filtering on experiment list
- `complete()` with user-supplied summary stats
- Offset-based pagination

## Integration Notes

- **`project_id` is required everywhere.** Provider constructor must accept `projectId` or `projectName` and resolve it. Could auto-create projects.
- **Cursor pagination.** `list()` and `getItems()` would need cursor-walking to simulate offset, or we drop offset support for this provider.
- **`complete()` becomes a no-op** or stores summary in experiment `metadata` via an update call.
- **`addResult` batch support** — Braintrust accepts arrays, so we could buffer results and flush in batches for performance.
- **`passed` has no direct field** — encode as `scores.passed = 1/0` or in metadata.

## Sources

- [API Reference](https://www.braintrust.dev/docs/reference/api)
- [Experiments Guide](https://www.braintrust.dev/docs/guides/evals)
- [Datasets Guide](https://www.braintrust.dev/docs/guides/datasets)
- [TypeScript SDK](https://www.braintrust.dev/docs/reference/sdk/typescript)
- [REST API — Experiments](https://www.braintrust.dev/docs/reference/api#experiments)
- [REST API — Datasets](https://www.braintrust.dev/docs/reference/api#datasets)

## Verdict

Strong match for DatasetProvider. Good match for EvalProvider with minor adapter work. The `project_id` requirement is the biggest integration concern — need it as constructor config. `complete()` is a no-op. Pagination mismatch is manageable. **High priority — this is the most requested provider.**
