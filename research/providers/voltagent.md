# Provider: VoltAgent

> **Status:** complete
> **Website:** https://voltagent.dev
> **npm:** `@voltagent/sdk`
> **Priority:** medium

## Overview

TypeScript AI agent framework with built-in eval and observability. VoltOps platform provides experiment tracking, dataset management, and a console UI. Two-layer hierarchy: Experiment → Run.

## TypeScript SDK

- **Package:** `@voltagent/sdk` (`VoltOpsRestClient`)
- **Auth:** Key pair — `x-public-key` + `x-secret-key` headers. Keys from VoltOps console.
- **Base URL:** `https://api.voltagent.dev`

## Concepts

| Viteval Concept | VoltAgent Equivalent | Notes                                           |
| --------------- | -------------------- | ----------------------------------------------- |
| Dataset         | Dataset              | Versioned, immutable snapshots.                 |
| DatasetItem     | Dataset Item         | `input`, `expected`, `extra`.                   |
| EvalRun         | Experiment + Run     | Two-layer: Experiment (config) → Run (exec).    |
| EvalResult      | Eval Result          | `input`, `output`, `scores`, `status`.          |
| Score           | Score Payload        | Per-result score array.                         |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method                              | Supported | Notes                                           |
| ------------ | -------------------------------------------------- | --------- | ----------------------------------------------- |
| `create()`   | CLI only (`voltagent eval dataset push`)            | No        | No SDK method for programmatic creation.        |
| `get()`      | `GET /evals/datasets/{id}`                          | Yes       | Returns dataset + version list.                 |
| `list()`     | `GET /evals/datasets?name=`                         | Yes       | Name filter. No pagination params documented.   |
| `update()`   | N/A                                                 | No        | Immutable versions. No mutation.                |
| `delete()`   | N/A                                                 | No        | Not exposed.                                    |
| `getItems()` | `GET /evals/datasets/{id}/versions/{vId}/items`     | Yes       | Paginated (page-size up to 1000).               |
| `addItems()` | CLI only (new version push)                         | No        | Appending items = pushing a new full version.   |

## EvalProvider Mapping

| Method        | Endpoint / SDK Method                          | Supported | Notes                                                     |
| ------------- | ---------------------------------------------- | --------- | --------------------------------------------------------- |
| `create()`    | `POST /evals/experiments` + `POST /evals/runs` | Yes       | Two-step: resolve/create Experiment, then create Run.     |
| `get()`       | N/A                                             | No        | No `GET /evals/runs/{id}` in SDK. State returned inline. |
| `list()`      | N/A                                             | No        | No list-runs endpoint. Experiments have `lastRunId`.      |
| `addResult()` | `POST /evals/runs/{id}/results`                 | Yes       | Batch results. Rich payload with scores, status, traces.  |
| `complete()`  | `POST /evals/runs/{id}/complete`                | Yes       | `status: "succeeded" \| "failed" \| "cancelled"`, summary. |

## Gaps

### Things they support that we don't

- Experiment → Run two-layer hierarchy
- Dataset immutable versioning with full snapshots
- `datasetItemId` / `datasetItemHash` linking on results
- `traceIds` on results for observability correlation
- Server-side scorer registration
- `triggerSource` field on runs (manual, CI, scheduled)

### Things we support that they don't

- Programmatic dataset creation (theirs is CLI-only)
- Dataset update, delete, addItems
- `get()` for individual runs
- `list()` for runs
- Mutable datasets

## Integration Notes

- **DatasetProvider is read-only.** No SDK methods for creating, updating, or deleting datasets. Only CLI push. Would need to either call undocumented HTTP endpoints or limit integration to read-only dataset access.
- **Two-step `create()`.** Must resolve-or-create an Experiment first, then create a Run under it. Provider constructor could accept an `experimentId` or auto-create one per eval suite name.
- **No `get()` or `list()` for runs.** Run state is only returned inline from create/complete/fail calls. Provider would need to cache run state locally.
- **`addResult()` is a strong match.** Batch insert with rich payload. Our scores map directly to their score payload format.
- **`complete()` is a strong match.** Direct status + summary support.

## Sources

- [VoltAgent Docs](https://voltagent.dev/docs)
- [VoltOps Console](https://console.voltagent.dev/)
- [GitHub — VoltAgent](https://github.com/VoltAgent/voltagent)
- [npm — @voltagent/sdk](https://www.npmjs.com/package/@voltagent/sdk)
- [Eval SDK Reference](https://voltagent.dev/docs/observability/voltops)

## Verdict

EvalProvider is a reasonable match for write operations (`addResult`, `complete`), but lacks read operations (`get`, `list`). DatasetProvider is read-only — unusable for write operations without undocumented API access. **Medium priority — good for the VoltAgent ecosystem but limited dataset support.**
