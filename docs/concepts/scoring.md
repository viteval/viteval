---
title: Scoring and thresholds
description: Understand scorer results, aggregation, and the per-case passing threshold.
---

# Scoring and thresholds

A scorer measures one property of a task output. It receives the output,
expected value, and additional case fields, then returns a score with optional
diagnostic metadata. Multiple scorers can measure different properties of the
same output.

## Choose a scoring method

| Method               | Use when                                                         | Model setup                   |
| -------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Deterministic checks | You can compare exact values, structures, or numeric differences | None                          |
| Embedding similarity | Semantic similarity matters more than exact wording              | Embedding model               |
| LLM judges           | Criteria need a model's judgment                                 | Language model                |
| Custom scorers       | Your application has its own rules                               | Depends on the implementation |

Model-based scores vary with the model and input. A passing score is evidence
against your chosen criteria, not a guarantee of correctness or safety.

## Aggregation and thresholds

Each case combines its scorer values using `mean` (the default), `median`, or
`sum`. The case passes when that aggregate is greater than or equal to its
threshold. The default threshold is `1`.

For example, scores of `1` and `0.6` have a mean of `0.8`. That case passes with
`threshold: 0.8` and fails with `threshold: 0.9`. With `sum`, the aggregate is
`1.6`, so thresholds can exceed `1`.

Use normalized scores between `0` and `1` for the usual mean or median gates.
Viteval accepts any finite score. Choose the threshold to match your scorer's
scale and the failures you want to catch.

## Null scores and execution failures

A null score contributes zero to aggregation. Built-in judges and embedding
scorers can return null with error metadata when a model request fails.

Non-finite scores, thrown scorer errors, task errors, and timeouts fail the case
regardless of its threshold. Inspect the recorded diagnostics to distinguish
execution failures from low-scoring outputs.

Suite summaries describe completed case outcomes. They do not replace the
per-case threshold check.

See [built-in scorers](/api/scoring/scorers),
[write a custom scorer](/guide/custom-scorers), and
[inspect results](/guide/results).
