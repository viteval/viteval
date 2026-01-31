# Configuration

How to configure Viteval evaluations and the CLI.

## Overview

Viteval uses a configuration file (`viteval.config.ts`) to define global settings for evaluations. Individual evaluations can override these settings.

## Configuration File

Create `viteval.config.ts` in your project root:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  timeout: 30000,
  reporters: ['default', 'json'],
  concurrency: 5,
});
```

## Configuration Options

| Option        | Type       | Default            | Description                       |
| ------------- | ---------- | ------------------ | --------------------------------- |
| `timeout`     | `number`   | `30000`            | Max time per evaluation item (ms) |
| `concurrency` | `number`   | `5`                | Number of parallel evaluations    |
| `reporters`   | `array`    | `['default']`      | Output reporters                  |
| `include`     | `string[]` | `['**/*.eval.ts']` | Evaluation file patterns          |
| `exclude`     | `string[]` | `['node_modules']` | Excluded patterns                 |
| `setupFiles`  | `string[]` | `[]`               | Setup files to run before evals   |

## Evaluation-Level Config

Override config per evaluation:

```ts
evaluate('my-eval', {
  data: myDataset,
  task: myTask,
  scorers: [myScorer],
  timeout: 60000, // Override timeout
  concurrency: 10, // Override concurrency
});
```

## Environment Variables

Configure via environment variables:

| Variable              | Description          |
| --------------------- | -------------------- |
| `VITEVAL_CONFIG`      | Path to config file  |
| `VITEVAL_TIMEOUT`     | Default timeout (ms) |
| `VITEVAL_CONCURRENCY` | Default concurrency  |
| `VITEVAL_DEBUG`       | Enable debug output  |

```bash
VITEVAL_TIMEOUT=60000 viteval run
```

## Config Discovery

Viteval searches for config files in order:

1. `viteval.config.ts`
2. `viteval.config.js`
3. `viteval.config.mjs`
4. `vitest.config.ts` (with viteval plugin)

## TypeScript Config

For TypeScript projects, use `defineConfig` for type safety:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  // Full IntelliSense and type checking
  timeout: 30000,
  reporters: ['default'],
});
```

## Extending Configs

Extend from a base configuration:

```ts
import { defineConfig, mergeConfig } from 'viteval';
import baseConfig from './viteval.base.config';

export default mergeConfig(baseConfig, {
  timeout: 60000,
});
```

## CLI Overrides

Override config via CLI flags:

```bash
# Override timeout
viteval run --timeout 60000

# Override concurrency
viteval run --concurrency 10

# Use specific config
viteval run --config ./custom.config.ts
```

## Environment-Specific Config

Use environment variables for different environments:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  timeout: process.env.CI ? 60000 : 30000,
  concurrency: process.env.CI ? 1 : 5,
  reporters: process.env.CI ? ['default', 'json'] : ['default'],
});
```

## Troubleshooting

### Config file not found

**Issue:** Viteval doesn't find your config file.

**Fix:** Ensure the file is in the project root or specify the path:

```bash
viteval run --config ./path/to/viteval.config.ts
```

### TypeScript config errors

**Issue:** TypeScript errors in config file.

**Fix:** Ensure `defineConfig` is imported:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  // ...
});
```

### Environment variables not applied

**Issue:** Env vars don't affect evaluation.

**Fix:** Set env vars before running:

```bash
export VITEVAL_TIMEOUT=60000
viteval run
```

## References

- [Evaluation](./evaluation.md) - How evaluations work
- [Reporters](./reporters.md) - Output formatting
- [Commands](../commands.md) - CLI reference
