# Add a Package

Create a new package in the Viteval monorepo.

## Option A: Using the Generator

### 1. Run the generator

```bash
pnpm gen @tools/core:package my-package
```

### 2. Follow the prompts

The generator creates:
- `packages/my-package/` directory
- `package.json` with workspace config
- `tsconfig.json` extending base
- `tsup.config.ts` for building
- `vitest.config.ts` for testing
- `src/index.ts` entry point

### 3. Install and build

```bash
pnpm install && pnpm build
```

## Option B: Manual Setup

### 1. Create the directory

```bash
mkdir -p packages/my-package/src
```

### 2. Create package.json

```json
{
  "name": "@viteval/my-package",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest --typecheck",
    "check": "biome check .",
    "fix": "biome check --write .",
    "types": "tsc --noEmit"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "@tsconfig/node24/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "#/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 4. Create tsup.config.ts

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
})
```

### 5. Create vitest.config.ts

```ts
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
```

### 6. Create the entry point

```ts
// src/index.ts
export function hello() {
  return 'Hello from my-package!'
}
```

### 7. Install and build

```bash
pnpm install && pnpm build
```

## Adding Dependencies

Workspace dependency:

```bash
cd packages/my-package
pnpm add @viteval/internal
```

External dependency:

```bash
cd packages/my-package
pnpm add some-package
```

## References

- [Add a Feature](./add-feature.md) - Add functionality to a package
- [Commit Changes](./commit-changes.md) - Commit and push your changes
