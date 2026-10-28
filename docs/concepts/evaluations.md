---
title: Evaluations and tasks
description: Understand how cases, tasks, and scorers become executable evaluations.
---

# Evaluations and tasks

An evaluation measures a task against a set of cases. The task produces an output
for each input, then scorers measure that output against the expected value or
other criteria. A threshold determines whether each case passes.

## Execution model

`evaluate()` registers an evaluation and returns `void`. Viteval owns discovery,
execution options, scoring, and result persistence. Vitest runs cases internally;
configure evaluations through `viteval.config.ts`, not a runner setup module.

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Order extraction', {
  data: [{ input: 'Where is order ORD-1042?', expected: 'ORD-1042' }],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
  threshold: 1,
});
```

This example measures a deterministic extractor. Replace the task with a model
call to measure that implementation against the same cases.

## Task boundaries

A task receives `input` and additional case fields, such as retrieved context.
The expected value is reserved for scorers so the task cannot use the reference
answer as an input.

Tasks may be synchronous or asynchronous. Return the value you want scored,
whether that is text, a structured object, or another supported value. The
output type can differ from the expected-value type when your scorer handles both.

Call any model client or application code inside the task. The model configured
for built-in judges does not select the model your task calls.

## Failures and reports

Task errors, scorer errors, and timeouts fail the case. A score below the threshold
also fails it. Viteval reports the final outcome, and the JSON destination saves
evaluation inputs, outputs, scores, and diagnostics for inspection.

See [scoring and thresholds](/concepts/scoring) for pass/fail rules,
[configure models](/guide/models) for model setup, and
[`evaluate()`](/api/evaluate) for the parameter contract.
