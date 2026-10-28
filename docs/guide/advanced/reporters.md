# Reporters

Use result providers for evaluation inputs, outputs, and scores. Console output
is managed internally; there is no public runner-reporter configuration.

## Evaluation JSON

Select JSON in `viteval.config.ts` to save dashboard-readable evaluation details:

```ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  eval: { results: ['json'] },
});
```

JSON is registered by default. When supplying an explicit `providers` array,
include `createJsonProvider()` to make it available. Add hosted provider names to
`results` to publish the same outcomes without rerunning tasks.

## Run history and failures

JSON provider runs have distinct identities under `.viteval/results`; file
replacement is atomic. Per-evaluation `results` replaces the configured array;
`results: []` disables persistence. Persistence failures fail the run.

The old `--outputPath` flag is not part of V1. Result persistence is selected through
`eval.results`; runner reporters and setup hooks are internal implementation details.

Reports include `schemaVersion: 1`, passed/failed/skipped counts, project names,
case IDs and final states, execution errors, and suite summaries. The suite
median is the median of per-case median scores. Native tests without evaluation
metadata are excluded from evaluation counts. Execution failures still fail the CLI.

The dashboard uses those recorded outcomes instead of recalculating every case
from its mean score. This preserves median/sum gates, retries, skips, and
execution failures. Empty or malformed files are reported as warnings.
