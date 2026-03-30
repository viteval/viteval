# Provider: Humanloop

> **Status:** complete
> **Website:** https://humanloop.com
> **npm:** `humanloop`
> **Priority:** medium

## Overview

Prompt management and evaluation platform. Versioned datasets, evaluations scoped to Prompt/Flow files, async evaluator-driven scoring. TypeScript SDK available.

## TypeScript SDK

- **Package:** `humanloop`
- **Auth:** `X-API-KEY` header. Static API key per organization.
- **Base URL:** `https://api.humanloop.com/v5/`

## Concepts

| Viteval Concept | Humanloop Equivalent | Notes                                                    |
| --------------- | -------------------- | -------------------------------------------------------- |
| Dataset         | Dataset              | Versioned, immutable versions. Path-addressable.         |
| DatasetItem     | Datapoint            | `inputs` (dict), `messages` (chat), `target` (expected). |
| EvalRun         | Evaluation + Run     | Two-layer: Evaluation (container) → Run (execution).     |
| EvalResult      | Log                  | Output record. Scores computed async by Evaluators.      |
| Score           | Evaluator Judgment   | Async, computed by platform. Cannot push pre-computed.   |

## DatasetProvider Mapping

| Method       | Endpoint / SDK Method                        | Supported | Notes                                            |
| ------------ | -------------------------------------------- | --------- | ------------------------------------------------ |
| `create()`   | `POST /v5/datasets` (upsert)                 | Yes       | `path` as identifier. `action: "set"` for items. |
| `get()`      | `GET /v5/datasets/{id}`                      | Yes       | Supports `version_id`, `environment` params.     |
| `list()`     | `GET /v5/datasets`                           | Yes       | Page-based. Name filter, sort.                   |
| `update()`   | `POST /v5/datasets` (upsert same path)       | Partial   | No PATCH — upsert creates new version.           |
| `delete()`   | `DELETE /v5/datasets/{id}`                   | Yes       | Supported.                                       |
| `getItems()` | `GET /v5/datasets/{id}/datapoints`           | Yes       | Page-based. Version/environment filter.          |
| `addItems()` | `POST /v5/datasets` (upsert `action: "add"`) | Yes       | Append items to existing dataset.                |

## EvalProvider Mapping

| Method        | Endpoint / SDK Method                      | Supported | Notes                                                            |
| ------------- | ------------------------------------------ | --------- | ---------------------------------------------------------------- |
| `create()`    | `POST /v5/evaluations` + `POST .../runs`   | Yes       | Two-step. Evaluation requires a File (Prompt/Flow) reference.    |
| `get()`       | `GET /v5/evaluations/{id}` + `.../stats`   | Partial   | No single endpoint with results. Stats are separate.             |
| `list()`      | `GET /v5/evaluations?file_id=`             | Partial   | Filter by `file_id` only. No datasetId/status/tags filter.       |
| `addResult()` | `POST /v5/prompts/log`                     | Yes\*     | Scores are NOT pushable. Humanloop computes them via Evaluators. |
| `complete()`  | `PATCH /v5/evaluations/{id}/runs/{run_id}` | Yes       | `status: "completed"` or `"cancelled"`. No `"failed"`.           |

## Gaps

### Things they support that we don't

- Immutable dataset versioning (every mutation = new version)
- Path-based addressing (`"folder/dataset-name"`)
- Evaluator-driven async scoring (platform-side computation)
- Multiple evaluator types: code, LLM-as-judge, human review
- Control runs for baseline comparison
- `inputs` + `messages` + `target` datapoint structure (richer than input/expected)

### Things we support that they don't

- Pre-computed score pushing (`addResult` with scores)
- `failed` run status (only `completed` and `cancelled`)
- Free-standing evals (not tied to a Prompt/Flow file)
- Cross-file evaluation listing
- Atomic `addResult()` with embedded scores
- `duration` and `passed` fields on results

## Integration Notes

- **Critical: Cannot push pre-computed scores.** Humanloop expects its own Evaluators to compute scores after a Log is created. Pre-computed viteval scores would need to be stored in Log `metadata` as a workaround, losing platform-native score visualization.
- **Evaluations require a File reference.** A bare eval run with no associated Prompt file is not supported. Provider would need to create a placeholder File.
- **`failed` → `cancelled`.** Our `complete(status: 'failed')` maps to their `cancelled` status.
- **Two-step `create()`.** Create Evaluation, then create Run within it.
- **Dataset updates create new versions.** No in-place metadata update.

## Sources

- [API Reference (v5)](https://humanloop.com/docs/v5/api-reference)
- [Evaluation Overview](https://humanloop.com/docs/v5/evaluation/overview)
- [Datasets Guide](https://humanloop.com/docs/v5/evaluation/datasets)
- [TypeScript SDK — npm](https://www.npmjs.com/package/humanloop)
- [GitHub — humanloop-node](https://github.com/humanloop/humanloop-node)

## Verdict

DatasetProvider is a good match — all operations supported with minor version semantics differences. EvalProvider has a **fundamental mismatch**: you cannot push pre-computed scores. This makes it unsuitable as a pure results sink unless you either (a) use Humanloop's evaluators instead of viteval's scorers, or (b) store scores in metadata (losing native visualization). **Medium priority — the score-push limitation is a dealbreaker for many use cases.**
