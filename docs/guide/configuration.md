# Configuration

Viteval can be configured through configuration files, environment variables, and CLI options.

## Configuration File

Create a `viteval.config.ts` (or `.js`) file in your project root:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  // Test file patterns
  include: ['**/*.eval.{ts,js}'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  
  // Output options
  reporter: 'default', // 'default' | 'json' | 'verbose'
  bail: false,         // Stop on first failure
  
  // Parallel execution
  maxConcurrency: 5,   // Max parallel evaluations
  
  // Timeouts
  timeout: 30000,      // 30 seconds per evaluation
  
  // Environment
  env: {
    NODE_ENV: 'test',
  },
});
```

## File Patterns

### Include Patterns

Specify which files contain evaluations:

```ts
export default defineConfig({
  // Default: all .eval.ts/.eval.js files
  include: ['**/*.eval.{ts,js}'],
  
  // Custom patterns
  include: [
    'src/evals/**/*.ts',
    'tests/evaluations/**/*.js',
  ],
});
```

### Exclude Patterns

Exclude specific files or directories:

```ts
export default defineConfig({
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.spec.ts',        // Exclude unit tests
    'src/evals/draft/**',  // Exclude draft evaluations
  ],
});
```

## Reporters

### Default Reporter

The default reporter provides clean, readable output:

```ts
export default defineConfig({
  reporter: 'default',
});
```

### JSON Reporter

For programmatic processing:

```ts
export default defineConfig({
  reporter: 'json',
});
```

Output format:
```json
{
  "results": [
    {
      "name": "Color detection",
      "passed": true,
      "score": 0.95,
      "cases": [
        {
          "input": "What color is the sky?",
          "output": "Blue",
          "expected": "Blue",
          "scores": { "levenshtein": 1.0 }
        }
      ]
    }
  ],
  "summary": {
    "total": 1,
    "passed": 1,
    "failed": 0
  }
}
```

### Verbose Reporter

For detailed debugging:

```ts
export default defineConfig({
  reporter: 'verbose',
});
```

## Parallel Execution

Control how many evaluations run simultaneously:

```ts
export default defineConfig({
  // Run up to 3 evaluations in parallel
  maxConcurrency: 3,
  
  // Run one at a time (useful for debugging)
  maxConcurrency: 1,
});
```

## Timeouts

Set timeouts for different operations:

```ts
export default defineConfig({
  // Global timeout for each evaluation
  timeout: 60000, // 60 seconds
  
  // Per-evaluation timeouts (overrides global)
  evaluationTimeout: {
    'Long running eval': 120000, // 2 minutes
    'Quick eval': 10000,         // 10 seconds
  },
});
```

## Environment Variables

Configure Viteval through environment variables:

```bash
# File patterns
VITEVAL_INCLUDE="**/*.eval.{ts,js}"
VITEVAL_EXCLUDE="**/node_modules/**"

# Execution
VITEVAL_MAX_CONCURRENCY=3
VITEVAL_TIMEOUT=30000
VITEVAL_BAIL=true

# Output
VITEVAL_REPORTER=json
VITEVAL_VERBOSE=true

# Run evaluations
viteval
```

## Setup Files

Run setup code before evaluations:

```ts
// viteval.setup.ts
import { beforeAll, afterAll } from 'viteval';

beforeAll(async () => {
  // Setup database connections, API clients, etc.
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup
  console.log('Cleaning up...');
});
```

Reference in config:

```ts
export default defineConfig({
  setupFiles: ['./viteval.setup.ts'],
});
```

## Global Configuration

### API Keys and Secrets

Store sensitive configuration in environment variables:

```ts
// viteval.config.ts
export default defineConfig({
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
});
```

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

### Model Configuration

Centralize model configuration:

```ts
// viteval.config.ts
export default defineConfig({
  globals: {
    defaultModel: 'gpt-4',
    modelConfig: {
      temperature: 0.1,
      maxTokens: 1000,
    },
  },
});
```

Access in evaluations:

```ts
import { getGlobal } from 'viteval';

const modelConfig = getGlobal('modelConfig');
```

## TypeScript Configuration

For TypeScript projects, ensure proper types:

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["viteval/globals"]
  },
  "include": [
    "**/*.eval.ts",
    "viteval.config.ts",
    "viteval.setup.ts"
  ]
}
```

## Common Patterns

### Environment-Specific Config

```ts
const config = {
  development: {
    timeout: 10000,
    maxConcurrency: 1,
  },
  production: {
    timeout: 60000,
    maxConcurrency: 5,
  },
};

export default defineConfig(
  config[process.env.NODE_ENV] || config.development
);
```

### Shared Datasets Path

```ts
export default defineConfig({
  resolve: {
    alias: {
      '@datasets': path.resolve(__dirname, 'src/datasets'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});
```

Use in evaluations:

```ts
import { commonDatasets } from '@datasets/common';
import { llmUtils } from '@utils/llm';
```