---
'@viteval/core': minor
'viteval': minor
---

Decouple task return type from expected type in evaluations

- `Scorer`, `ScorerArgs`, and `createScorer` now accept separate `OUTPUT` and `EXPECTED` type parameters (defaults preserve backward compat)
- `Eval` and `evaluate()` infer `TASK_OUTPUT` from the task function independently of the data's expected type
- Scorers receive `output: TASK_OUTPUT` and `expected: EXPECTED` as distinct types
- Add `wrapScorer()` utility to adapt existing scorers for mismatched types via `output`/`expected` mapping functions
- Fix prebuilt scorer return types for the new type parameter ordering

Closes #110
