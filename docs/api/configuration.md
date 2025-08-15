# Configuration

Viteval provides flexible configuration options to customize evaluation behavior, performance, and output.

## Configuration File

Create a `viteval.config.ts` file in your project root:

```ts
// viteval.config.ts
import { defineConfig } from 'viteval/config'

export default defineConfig({
  reporter: 'console',
  eval: {
    include: ['src/**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
    timeout: 100000 // 100 seconds (default)
  }
})
```

## Configuration Options

### Provider Configuration

#### `provider`
Configure API providers for LLM access:

```ts
export default defineConfig({
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      project: 'my-project',
      organization: 'my-org'
    }
  }
})
```

Or provide a client directly:

```ts
import { OpenAI } from 'openai'

export default defineConfig({
  provider: {
    openai: {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
  }
})
```

### Reporter Configuration

#### `reporter`
- **Type:** `'console' | 'json' | VitevalReporterBraintrust`
- **Default:** `'console'`

Configure output reporter:

```ts
export default defineConfig({
  reporter: 'console' // Console output
})

// or JSON output
export default defineConfig({
  reporter: 'json'
})

// or Braintrust integration
export default defineConfig({
  reporter: {
    type: 'braintrust',
    apiKey: process.env.BRAINTRUST_API_KEY
  }
})
```

### Evaluation Configuration

#### `eval.include`
- **Type:** `string[]`
- **Default:** `undefined`

Glob patterns to include evaluation files:

```ts
export default defineConfig({
  eval: {
    include: [
      'src/**/*.eval.ts',
      'tests/**/*.eval.ts'
    ]
  }
})
```

#### `eval.exclude`
- **Type:** `string[]`
- **Default:** `undefined`

Glob patterns to exclude:

```ts
export default defineConfig({
  eval: {
    exclude: [
      '**/*.draft.eval.ts',
      'src/experimental/**'
    ]
  }
})
```

#### `eval.setupFiles`
- **Type:** `string[]`
- **Default:** `undefined`

Setup files to run before evaluations:

```ts
export default defineConfig({
  eval: {
    setupFiles: ['./viteval.setup.ts']
  }
})
```

#### `eval.timeout`
- **Type:** `number`
- **Default:** `100000` (100 seconds)

Timeout for individual evaluations (in milliseconds):

```ts
export default defineConfig({
  eval: {
    timeout: 300000 // 5 minutes
  }
})
```

### Server Configuration

#### `server.sourcemap`
- **Type:** `boolean | 'inline'`
- **Default:** `undefined`

Configure sourcemap generation:

```ts
export default defineConfig({
  server: {
    sourcemap: true
  }
})
```

#### `server.deps`
Configure dependency handling:

```ts
export default defineConfig({
  server: {
    deps: {
      inline: ['some-package'],
      external: ['external-package']
    }
  }
})
```

### Dependencies Configuration

#### `deps.interopDefault`
- **Type:** `boolean`
- **Default:** `true`

Whether to use the interopDefault plugin:

```ts
export default defineConfig({
  deps: {
    interopDefault: false
  }
})
```

#### `deps.optimizer`
Configure dependency optimization:

```ts
export default defineConfig({
  deps: {
    optimizer: {
      ssr: {
        include: ['some-package']
      },
      web: {
        include: ['web-package']
      }
    }
  }
})
```

## Environment-Specific Configuration

```ts
export default defineConfig({
  reporter: process.env.CI ? 'json' : 'console',
  eval: {
    timeout: process.env.CI ? 180000 : 100000,
    include: process.env.NODE_ENV === 'development' 
      ? ['src/**/*.eval.ts']
      : ['**/*.eval.ts']
  }
})
```

## TypeScript Support

Viteval provides full TypeScript support for configuration:

```ts
import type { VitevalConfig } from 'viteval/config'

const config: VitevalConfig = {
  reporter: 'console',
  eval: {
    include: ['**/*.eval.ts'],
    timeout: 100000
  }
}

export default config
```

## CLI Configuration

Override configuration via CLI flags:

```bash
# Use a specific config file
viteval run --config viteval.prod.config.ts

# Override root directory
viteval run --root ./src

# Override pattern
viteval run "**/*.smoke.eval.ts"
```