# Reporters

Use result providers for evaluation inputs, outputs, and scores. Runner reporters
are an optional console/CI concern, not a persistence requirement.

## Vitest reporters

### `default`

Vitest's default reporter prints results to the console. Viteval does not wrap or replace it.

### `json`

Vitest includes native JSON, JUnit, TAP, tree, verbose, dot, and other reporters. Pass them through Vitest's native CLI:

```sh
viteval run --reporter json
```

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

The old `--outputPath` flag is not part of V1. Native `--outputFile` only applies
to runner reporters, not evaluation storage. The low-level `JsonReporter` export
remains available for native runner integrations; do not add
it alongside JSON provider persistence unless you intentionally want two reports.

Reports include `schemaVersion: 1`, passed/failed/skipped counts, project names,
case IDs and final states, execution errors, and suite summaries. The suite
median is the median of per-case median scores. Native tests without evaluation
metadata are excluded from evaluation counts; the CLI still preserves Vitest's
overall exit code.

The dashboard uses those recorded outcomes instead of recalculating every case
from its mean score. This preserves median/sum gates, retries, skips, and
execution failures. Empty or malformed files are reported as warnings.
