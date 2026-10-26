# Write evals like you write tests

Viteval is an open-source LLM evaluation framework built on Vitest. Use your
application code and familiar TypeScript APIs to test prompts, retrieval
pipelines, and agents. Start locally, then run the same evaluations in CI or
on your own infrastructure.

## Familiar tooling

![Vitest configuration, application tests, and evaluations in the same project](/assets/feature-tooling.svg)

Keep the tools you already use. Vitest runs your evaluations with its native
configuration, setup files, file filters, and watch mode. Viteval adds an
`evaluate()` function that combines cases, your task, and scorers.

```ts
import { evaluate, scorers } from 'viteval';
import { retrieve, answer } from './knowledge-agent';

evaluate('Knowledge answers', {
  data: [{ input: 'How long are audit logs retained?', expected: '30 days.' }],
  task: async ({ input }) => {
    const context = await retrieve(input);
    return (await answer({ question: input, context })).text;
  },
  scorers: [scorers.answerCorrectness(), scorers.answerRelevancy()],
  threshold: 0.8,
});
```

`retrieve` and `answer` are your application's functions, not Viteval APIs. They can call
your existing model client or agent framework. Viteval scores the returned
category against the expected answer; it does not replace your application
logic or guarantee that a model will return the right answer.

Use inline cases while exploring, then move shared cases into a dataset when
you need to reuse them.

- [Core concepts](/guide/concepts): cases, tasks, scorers, and thresholds
- [Evaluation API](/api/evaluate): options and typed inputs
- [Configuration](/api/configuration): Vitest configuration and worker setup
- [Examples](/examples): deterministic and model-backed evaluations

## Built-in defaults

![Illustrative scores from exact matching, semantic similarity, and custom criteria](/assets/feature-defaults.svg)

You do not need to build a scoring system before writing your first evaluation.
Viteval includes deterministic checks, model-based scorers, reusable datasets,
JSON reports, and a local dashboard.

```ts
import { scorers } from 'viteval';

// Deterministic checks: no scoring model required.
scorers.exactMatch();
scorers.levenshtein();
scorers.jsonDiff();

// Model-based scoring: configure a model and its credentials first.
scorers.answerSimilarity();
scorers.factual();
```

Choose scorers that match the task. Exact matching works well for a routing
category; a free-form answer may need semantic checks or a custom rubric.
Model-based scores depend on the configured model and require API requests.

Use `createScorer()` when built-in checks do not capture your criteria. Save
reports with the JSON reporter to inspect individual inputs, outputs, scores,
and execution errors in the dashboard.

- [Scorers](/api/scorers): built-in checks and model requirements
- [Custom scorers](/api/create-scorer): your criteria and metadata
- [Datasets](/api/define-dataset): reusable evaluation cases
- [CLI and dashboard](/guide/cli#view-results): inspect saved runs

## Local-first

![Local datasets and results stored under the project's .viteval directory](/assets/feature-local.svg)

No hosted Viteval account is required. The generated setup binds JSON storage
to your project, and the dashboard reads your local evaluation data.

```text
.viteval/
├── datasets/
└── results/
```

```bash
pnpm exec viteval run
pnpm exec viteval ui
```

The starter evaluation runs without an API key. Your task or model-based
scorers may still send data to the model service you configure. Local result
storage does not make an external model request private or offline.

Hosted storage is optional. Dataset storage and evaluation results can use
different providers, so you can keep cases local while publishing results.

- [Getting started](/guide/getting-started): initialize the local workflow
- [Reporters](/guide/advanced/reporters): configure saved reports
- [Providers](/guide/providers): local and hosted storage capabilities

## Run anywhere

![The same evaluations running on a laptop, in CI, and on your own runner](/assets/feature-anywhere.svg)

Use the same evaluation files on your laptop, in a CI job, or on a Node runner
your team controls. Viteval requires Node 26 or later; model access and provider
credentials depend on your chosen integrations.

```bash
# Iterate locally with Vitest watch mode.
pnpm exec viteval run --watch

# Run once in CI or on your own runner.
pnpm exec viteval run
```

A failing evaluation returns a non-zero exit code, so your CI workflow can
block a merge or deployment. Keep reports as artifacts or publish results to a
supported provider.

| Integration                       | Use it for                                             |
| --------------------------------- | ------------------------------------------------------ |
| Local JSON or SQLite              | Datasets and evaluation results on your infrastructure |
| Braintrust                        | Shared datasets and evaluation experiments             |
| Langfuse                          | Datasets, case traces, and scores                      |
| VoltOps                           | Hosted experiments and case results                    |
| Amazon S3 or Google Cloud Storage | Shared datasets, with a separate results provider      |

These are optional storage integrations, not requirements for running
evaluations. Your task function chooses its own model or agent client.

- [CI integration](/guide/advanced/ci): automate runs and preserve reports
- [Provider capabilities](/guide/providers): choose storage
- [Combine providers](/guide/providers#combine-providers): separate datasets and results

## Start with one evaluation

```bash
pnpm add viteval@rc
```

V1 is currently a release candidate. [Write your first evaluation](/guide/getting-started)
or [browse the examples](/examples).
