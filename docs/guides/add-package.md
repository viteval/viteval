# Add a Package

Create a new package in the Viteval monorepo.

## Prerequisites

- Local environment set up (see [Setup Local Environment](./setup-local-env.md))
- Dependencies installed (`pnpm install`)
- Clear understanding of the package's purpose and scope

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
- `tsdown.config.ts` for building
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
    "build": "tsdown",
    "dev": "tsdown --watch",
    "test": "vitest --typecheck",
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

### 4. Create tsdown.config.ts

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

### 5. Create vitest.config.ts

```ts
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
```

### 6. Create the entry point

```ts
// src/index.ts
export function hello() {
  return 'Hello from my-package!';
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

## Verification

Verify the package builds successfully:

```bash
pnpm --filter @viteval/my-package build
```

Check the package is recognized in the workspace:

```bash
pnpm ls --filter "@viteval/*"
```

Verify exports are correct:

```bash
ls packages/my-package/dist/
```

Expected: `index.js`, `index.d.ts`, and source maps.

## Troubleshooting

### Package not found in workspace

**Issue:** `pnpm --filter @viteval/my-package` returns "No projects matched".

**Fix:** Ensure `package.json` has the correct name and run:

```bash
pnpm install
```

### Build fails with missing dependencies

**Issue:** Build fails because dependencies aren't installed.

**Fix:** Add missing dependencies:

```bash
cd packages/my-package
pnpm add tsdown vitest vite-tsconfig-paths -D
```

### TypeScript can't resolve workspace dependencies

**Issue:** Imports from other workspace packages fail to resolve.

**Fix:** Build dependencies first, then the new package:

```bash
pnpm build
```

Or add the dependency explicitly:

```bash
cd packages/my-package
pnpm add @viteval/internal
```

## References

- [Add a Feature](./add-feature.md) - Add functionality to a package
- [Commit Changes](./commit-changes.md) - Commit and push your changes
