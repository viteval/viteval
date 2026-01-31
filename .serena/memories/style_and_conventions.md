# Code Style and Conventions

## General Principles
- Prefer functional programming
- Keep solutions simple and focused
- Avoid over-engineering

## TypeScript Conventions
- Use TypeScript for all source files
- Target ES2015 with ESNext modules
- Export types explicitly when needed
- Use generics for flexible APIs (e.g., `<OUTPUT, EXTRA extends Extra = Extra>`)

## Naming Conventions
- **Functions:** camelCase (e.g., `createScorer`, `defineDataset`)
- **Interfaces:** PascalCase (e.g., `ScorerConfig`, `DataItem`)
- **Type aliases:** PascalCase (e.g., `ScoreResult`)
- **Files:** kebab-case (e.g., `custom.ts`, `custom.test.ts`)
- **Packages:** kebab-case with `@viteval/` scope (e.g., `@viteval/core`)

## File Organization
- Co-locate tests with source: `feature.ts` → `feature.test.ts`
- Use index.ts files for module exports
- Group related functionality in directories (e.g., `scorer/`, `dataset/`)

## Testing
- Use Vitest (`describe`, `it`, `expect`, `vi`)
- BDD style preferred
- Import test utilities explicitly: `import { describe, it, expect } from 'vitest'`
- No global test variables

## Documentation
- Add JSDoc with examples for public APIs
- Be succinct - no fluff
- Use Mermaid for diagrams
- Use GFM alerts for callouts

## Code Quality Tools
- **Linting:** oxlint (not ESLint)
- **Formatting:** oxfmt (not Prettier)
- Run `pnpm fix` to auto-fix issues
- Run `pnpm check` to verify
