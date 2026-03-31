# Provider: LangSmith

> **Status:** complete
> **Website:** https://smith.langchain.com
> **npm:** `langsmith`
> **Priority:** high

## Overview

LangChain's eval, testing, and observability platform. Full CRUD on datasets with versioning, experiments via sessions, per-run feedback scores. Best dataset API of any provider researched.

## TypeScript SDK

- **Package:** `langsmith`
- **Auth:** `LANGSMITH_API_KEY` env var or `X-Api-Key` header
- **Base URL:** `https://api.smith.langchain.com` (configurable via `LANGSMITH_ENDPOINT`)

## Concepts

| Viteval Concept | LangSmith Equivalent | Notes                                                |
| --------------- | -------------------- | ---------------------------------------------------- |
| Dataset         | Dataset              | Versioned, with splits. Full CRUD.                   |
| DatasetItem     | Example              | `inputs` (dict), `outputs` (expected), `metadata`.   |
| EvalRun         | Session / Project    | Experiments are sessions. No status lifecycle.       |
| EvalResult      | Run                  | Execution trace linked to an Example.                |
| Score           | Feedback             | Separate entity. `key`, `score`, `value`, `comment`. |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method                   | Supported | Notes                               |
| ------------ | --------------------------------------- | --------- | ----------------------------------- |
| `create()`   | `POST /api/v1/datasets` + bulk examples | Yes       | Two-step. Description + metadata.   |
| `get()`      | `GET /api/v1/datasets/{id}` or by name  | Yes       | Both ID and name lookup supported.  |
| `list()`     | `GET /api/v1/datasets`                  | Yes       | Pagination, name/type filters.      |
| `update()`   | `PATCH /api/v1/datasets/{id}`           | Yes       | Name, description updatable.        |
| `delete()`   | `DELETE /api/v1/datasets/{id}`          | Yes       | Supported.                          |
| `getItems()` | `GET /api/v1/examples?dataset_id=`      | Yes       | Pagination, metadata/split filters. |
| `addItems()` | `POST /api/v1/examples/bulk`            | Yes       | Bulk creation supported natively.   |

## EvalProvider Mapping

| Method        | Endpoint / SDK Method                        | Supported | Notes                                                  |
| ------------- | -------------------------------------------- | --------- | ------------------------------------------------------ |
| `create()`    | `POST /api/v1/sessions`                      | Yes       | Name, tags, metadata. No explicit status field.        |
| `get()`       | `GET /api/v1/sessions/{id}?include_stats`    | Yes       | Stats include latency, cost, feedback aggregates.      |
| `list()`      | `GET /api/v1/sessions`                       | Partial   | Filter by name/metadata. No `datasetId` filter.        |
| `addResult()` | `createRun()` + `createFeedback()` per score | Yes\*     | Two+ API calls. Run linked via `reference_example_id`. |
| `complete()`  | `PATCH /api/v1/sessions/{id}`                | Partial   | Can update metadata but no status field.               |

## Gaps

### Things they support that we don't

- Dataset versioning with version labels (e.g. "prod")
- Example splits (train/test/validation)
- Three-tier structure: Session → Run → Feedback
- Token counts, cost tracking, latency stats per run
- `reference_example_id` linking runs to dataset examples
- Comparison across sessions with auto-computed diffs

### Things we support that they don't

- Explicit run status lifecycle
- `complete()` with user-supplied summary
- Atomic `addResult()` (single call)
- `passed` boolean (must encode as feedback)
- `datasetId` filter on run listing

## Integration Notes

- **Best DatasetProvider match** of any provider. Full CRUD, bulk operations, both ID and name lookup. Nearly 1:1 mapping.
- **`addResult()` is 2+ calls.** Create a Run (with `reference_example_id` to link to dataset example), then one `createFeedback()` per score metric.
- **`complete()` would update session metadata** with our summary stats since there's no native status field.
- **No `datasetId` on sessions.** Dataset association is per-Run (via `reference_example_id`), not per-Session. Listing runs for a dataset requires querying through runs.
- **`passed` encoded as feedback:** `createFeedback({ key: 'passed', score: 1 })`.

## Sources

- [LangSmith Docs](https://docs.smith.langchain.com/)
- [Evaluation Guide](https://docs.smith.langchain.com/evaluation)
- [Datasets Guide](https://docs.smith.langchain.com/evaluation/how_to_guides/datasets)
- [API Reference](https://docs.smith.langchain.com/reference/api)
- [TypeScript SDK — npm](https://www.npmjs.com/package/langsmith)
- [GitHub — langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk)

## Verdict

Excellent DatasetProvider match — best of any provider. EvalProvider is good with standard adapter patterns (multi-call `addResult`, metadata-based status). The three-tier data model (Session → Run → Feedback) vs our two-tier (EvalRun → Result) is manageable. **High priority — LangChain ecosystem is huge.**
