# Naming Conventions

File and variable naming standards for the Viteval codebase.

## Files

### General Rules

| Type         | Convention | Example                 |
| ------------ | ---------- | ----------------------- |
| Source files | kebab-case | `custom-scorer.ts`      |
| Test files   | kebab-case | `custom-scorer.test.ts` |
| Type files   | kebab-case | `scorer-types.ts`       |
| Index files  | `index.ts` | `index.ts`              |

### File Naming

```
src/
├── scorer/
│   ├── index.ts           # Public exports
│   ├── custom-scorer.ts   # Implementation
│   ├── custom-scorer.test.ts
│   └── types.ts           # Types for this module
```

### Avoid

- PascalCase files (e.g., `CustomScorer.ts`)
- Underscores (e.g., `custom_scorer.ts`)
- Abbreviations unless common (e.g., `cfg.ts`)

## Variables

### General Rules

| Type       | Convention | Example            |
| ---------- | ---------- | ------------------ |
| Variables  | camelCase  | `scorerResult`     |
| Constants  | camelCase  | `defaultThreshold` |
| Functions  | camelCase  | `createScorer`     |
| Classes    | PascalCase | `ScorerRunner`     |
| Types      | PascalCase | `ScorerOptions`    |
| Interfaces | PascalCase | `DataItem`         |
| Enums      | PascalCase | `ScorerType`       |

### Examples

```ts
// Variables and constants
const defaultThreshold = 0.5;
let currentScore = 0;

// Functions
function createScorer(options: ScorerOptions): Scorer {
  // ...
}

// Types and interfaces
interface ScorerOptions {
  name: string;
  threshold?: number;
}

type ScorerResult = {
  score: number;
  reason?: string;
};

// Classes (use sparingly)
class EvaluationRunner {
  // ...
}
```

### Avoid

- Hungarian notation (e.g., `strName`, `iCount`)
- Single letter names except in loops (e.g., `i`, `j`)
- Abbreviations unless obvious (e.g., `cfg`, `opts`)
- Prefixes like `I` for interfaces

## Exports

### Named Exports

Prefer named exports over default exports:

```ts
// Good
export function createScorer() {}
export interface ScorerOptions {}

// Avoid
export default function createScorer() {}
```

### Re-exports

Use barrel files (index.ts) for public API:

```ts
// src/scorer/index.ts
export { createScorer } from './custom-scorer';
export type { ScorerOptions, ScorerResult } from './types';
```

## References

- [TypeScript Standards Overview](./overview.md)
- [Patterns](./patterns.md)
