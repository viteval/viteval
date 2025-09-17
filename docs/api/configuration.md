# `defineConfig()`

Viteval provides flexible configuration options to customize evaluation behavior, performance, and output.

## Import

```ts
import { defineConfig } from 'viteval/config'
```

## Configuration File

Create a `viteval.config.ts` file in your project root:

```ts
// viteval.config.ts
import { defineConfig } from 'viteval/config'

export default defineConfig({
  reporter: 'default',
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
      include: ['some-package']
    }
  }
})
```
