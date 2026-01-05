# Add an Example

Create a new example project demonstrating Viteval usage.

## Option A: Using the Generator

### 1. Run the generator

```bash
pnpm gen @tools/core:example my-example
```

### 2. Follow the prompts

The generator creates:
- `examples/my-example/` directory
- `package.json` with viteval dependency
- `viteval.config.ts` configuration
- Example evaluation file

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run the example

```bash
cd examples/my-example
pnpm eval
```

## Option B: Manual Setup

### 1. Create the directory

```bash
mkdir -p examples/my-example
```

### 2. Create package.json

```json
{
  "name": "example-my-example",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "eval": "viteval run",
    "types": "tsc --noEmit"
  },
  "dependencies": {
    "viteval": "workspace:^"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "@tsconfig/node24/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noEmit": true
  },
  "include": ["*.ts"]
}
```

### 4. Create viteval.config.ts

```ts
import { defineConfig } from 'viteval/config'

export default defineConfig({
  eval: {
    timeout: 30000,
  },
})
```

### 5. Create an evaluation file

```ts
// example.eval.ts
import { evaluate, createScorer } from 'viteval'

const exactMatch = createScorer({
  name: 'exact-match',
  score: ({ output, expected }) => ({
    score: output === expected ? 1.0 : 0.0,
  }),
})

evaluate('uppercase-example', {
  data: [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
  ],
  task: async ({ input }) => input.toUpperCase(),
  scorers: [exactMatch],
})
```

### 6. Install and run

```bash
pnpm install
pnpm eval
```

## Best Practices

- Keep examples focused on one concept
- Use realistic data, not `foo`/`bar`
- Add comments explaining non-obvious code

## References

- [Commit Changes](./commit-changes.md) - Commit and push your changes
