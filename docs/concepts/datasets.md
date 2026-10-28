---
title: Datasets
description: Understand inline cases, reusable generators, and persisted or in-memory datasets.
---

# Datasets

A dataset holds the cases used to measure a task. Each case contains an `input`
and an `expected` value. It can also have a display name and additional fields,
such as context or a scoring rubric.

## Inline cases and generators

For a small evaluation, pass an array directly to `evaluate()`. A generator
function can load or construct those cases asynchronously. Inline data belongs
to that evaluation and does not create a named, persisted dataset.

## Reusable datasets

`defineDataset()` wraps a generator in a named dataset that multiple evaluations
can share. Persisting the cases lets you compare implementations against the
same inputs rather than a newly generated set on every run.

```ts
import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'order-extraction',
  data: async () => [
    { input: 'Please cancel ord-2087.', expected: 'ORD-2087' },
    { input: 'How do I update my address?', expected: '' },
  ],
});
```

## Storage modes

Dataset definitions select write destinations with `providers`. Omitted inherits
`dataset.providers` from config; an explicit array replaces it. The default JSON
destination writes files under `.viteval/datasets`.

`evaluate()` loads saved cases by name and generates them if missing. Changing
the generator does not replace existing cases. Use `viteval data --overwrite`
when you deliberately want a new saved dataset.

With `providers: []`, each load generates cases without persisting them. A
generator runs once per generation operation, even with multiple destinations.
To read a multi-destination dataset, select a source explicitly, for example
`data: ({ langfuse }) => langfuse.dataset('support')`. Generation destinations
and evaluation read sources are independent.

## Dataset discovery

The data command discovers datasets in dataset and evaluation modules. It runs
their generators, not evaluation tasks or scorers. Module-level code still runs
during import, so keep expensive calls inside task functions.

See [`data`](/cli/data) for discovery rules,
[`defineDataset()`](/api/define-dataset) for the API, and
[storage and results](/concepts/storage) for provider roles.
