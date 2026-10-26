# Reporters

Use Vitest reporters for test results and Viteval's JSON reporter for evaluation
inputs, outputs, and scores.

## Vitest reporters

### `default`

Vitest's default reporter prints results to the console. Viteval does not wrap or replace it.

### `json`

Vitest includes native JSON, JUnit, TAP, tree, verbose, dot, and other reporters. Pass them through Vitest's native CLI:

```sh
viteval run --reporter json
```

## Evaluation JSON

Viteval's JSON reporter saves evaluation scores and artifacts. Vitest's built-in
JSON reporter saves test results without those details. Configure both if you
need both formats:

```ts
import { JsonReporter } from 'viteval/reporters';
import { defineConfig } from 'viteval/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      new JsonReporter({ outputFile: '.viteval/results/<run>.json' }),
    ],
  },
});
```

Viteval's reporter implements Vitest's `Reporter` interface. It reads evaluation
artifacts and records the final case states reported by Vitest.

## Run history and failures

`<id>`, `<run>`, and `<timestamp>` placeholders use the current run identity.
Watch reruns receive new identities. Static output filenames are
overwritten. JSON file replacement is atomic.

For a stable destination, configure the evaluation reporter in `vitest.config.ts`:

```ts
new JsonReporter({ outputFile: '.viteval/results/latest.json' });
```

The old `--outputPath` flag is not part of v1. Native Vitest's `--outputFile` applies
to its built-in reporters; use the reporter constructor above for Viteval's
evaluation JSON. With `new JsonReporter()` and no output file, the completed
evaluation report is written to stdout.

Reports include `schemaVersion: 1`, passed/failed/skipped counts, project names,
case IDs and final states, execution errors, and suite summaries. The suite
median is the median of per-case median scores. Native tests without evaluation
metadata are excluded from evaluation counts; the CLI still preserves Vitest's
overall exit code.

The dashboard uses those recorded outcomes instead of recalculating every case
from its mean score. This preserves median/sum gates, retries, skips, and
execution failures. Empty or malformed files are reported as warnings.
