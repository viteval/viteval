# Patterns

Global code patterns for the Viteval codebase.

## Imports

### Internal alias

Use `#/` within packages to import from other files in the same package:

```ts
import { getRuntimeConfig } from '#/internals/config'
```

Configured in `tsconfig.json`:

```json
{
  "paths": { "#/*": ["./src/*"] }
}
```

### Cross-package

Use package names for workspace packages:

```ts
import { evaluate, createScorer } from '@viteval/core'
import { hasKey, isObject } from '@viteval/internal'
```
