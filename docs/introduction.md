---
title: Introduction
description: Evaluate prompts and agents in TypeScript with Vitest-powered execution and scoring.
---

# Introduction

Viteval is an LLM evaluation framework powered by Vitest. Define cases, run a
task against each one, and score the outputs to measure how your application behaves.

Use it to compare prompt changes, check structured outputs, or catch regressions
in an agent. Your task can call any model or application code.

## How an evaluation works

Each evaluation combines:

- **Data:** inputs and expected outputs, defined inline or in a reusable dataset.
- **A task:** the function that produces an output for each input.
- **Scorers:** functions that measure the output against your criteria.
- **A threshold:** the minimum score a case needs to pass.

Vitest handles execution, file discovery, and watch mode. Viteval adds datasets,
scoring, and evaluation results. You do not need an existing test suite to use it.

## Choose how to score

Start with deterministic checks when you know the expected answer. Use embedding
similarity or an LLM judge when exact matching does not fit. You can also write
custom scorers for your application's requirements.

See [built-in scorers](/api/scoring/scorers) for the available checks and
[scoring and thresholds](/concepts/scoring) for score aggregation and passing rules.

## Keep control of execution and data

Run evaluations locally, in CI, or on your own infrastructure. Model requests
use the clients and credentials you configure.

Start with local JSON storage and inspect saved reports in the dashboard. Add
[storage providers](/guide/providers) when you need a database or a hosted
evaluation platform. A hosted account is optional.

## Run your first evaluation

Follow [Getting started](/getting-started) to install Viteval, run an evaluation
without an API key, and inspect its results. Then replace the task with a model
call using the same cases.
