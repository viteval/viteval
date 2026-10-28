---
title: Storage and results
description: Understand dataset providers, result persistence, and local JSON reports.
---

# Storage and results

Viteval separates execution from storage. Vitest runs the task and scorers.
Providers store datasets or evaluation results. The JSON result destination
saves a local snapshot of each completed run.

## Dataset providers

Dataset providers store named case collections. The default JSON provider uses
`.viteval/datasets`. Optional providers store cases in a database, object storage,
or a hosted platform without changing the dataset API.

## Evaluation providers

Evaluation providers persist run metadata and case outcomes. Configure datasets
and evaluation results independently. For example, keep cases in local JSON and
publish results to Braintrust.

S3 and Google Cloud Storage providers implement dataset storage only. Use a
separate evaluation provider for results.

## JSON reports and the dashboard

`eval.results: ['json']` saves a combined run snapshot containing inputs, outputs, scores,
final Vitest outcomes, and diagnostics. The local dashboard reads these JSON
reports from `.viteval/results`.

A hosted provider and JSON can run together with `results: ['json', 'braintrust']`.
The hosted provider publishes results while JSON keeps a local copy. Hosted
results do not automatically appear in the local dashboard.

No runner reporter configuration is needed. An explicit destination array
replaces inherited destinations; `[]` disables persistence.

## Provider capabilities

| Provider             | Datasets                       | Evaluation results                  |
| -------------------- | ------------------------------ | ----------------------------------- |
| JSON (default)       | Local files                    | Local files                         |
| SQLite               | Local database                 | Local database                      |
| Braintrust           | Hosted datasets                | Experiments and case results        |
| Langfuse             | Create, read, and add items    | Case traces and scores              |
| VoltOps              | Upload versions and read items | Hosted experiments and case results |
| Amazon S3            | Versioned objects              | Use a separate results provider     |
| Google Cloud Storage | Versioned objects              | Use a separate results provider     |

## Serialization and errors

Persist JSON-compatible values. Provider operations return Result values, and
initialization or persistence failures fail the evaluation run. Backend
capabilities differ, especially for updates, replacement, and historical reads.

See [set up storage providers](/guide/providers) for backend setup and limitations,
[inspect results](/guide/results) for the dashboard workflow, and
[Configuration](/api/configuration) for destination selection.
