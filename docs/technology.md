# Technology Stack

Technologies and dependencies used in the Viteval codebase.

## Requirements

- Node.js >= 22.0.0
- pnpm >= 10.0.0

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | ~5.9.x | Type-safe JavaScript |
| Vitest | ^4.0.x | Test runner (evals run as tests) |
| pnpm | 10.x | Package manager |
| Nx | 22.x | Monorepo task orchestration |

## Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| tsdown | ^0.19.x-beta | TypeScript bundler (Rolldown-based) |
| SWC | ~1.15.x | Fast TypeScript compilation |
| Vite | ^7.2.x | Development server and bundling |

## Code Quality

| Tool | Version | Purpose |
|------|---------|---------|
| Biome | ^2.3.x | Linting and formatting |
| TypeScript | ~5.9.x | Type checking |

## Key Dependencies

### @viteval/core

| Dependency | Purpose |
|------------|---------|
| `vitest` | Test runner integration |
| `ts-pattern` | Pattern matching |
| `zod` | Schema validation |
| `openai` | LLM provider |
| `autoevals` | Prebuilt scorer implementations |
| `js-yaml` | YAML config parsing |

### @viteval/internal

| Dependency | Purpose |
|------------|---------|
| `type-fest` | TypeScript type utilities |

### @viteval/cli

| Dependency | Purpose |
|------------|---------|
| `yargs` | Command-line argument parsing |
| `chalk` | Terminal colors |
| `find-up` | Config file discovery |

### @viteval/ui

| Dependency | Purpose |
|------------|---------|
| `react` | UI framework (v19) |
| `@tanstack/react-router` | Client routing |
| `tailwindcss` | Styling (v4) |
| `express` | Dev server |

## Biome Configuration

Formatting rules:

| Setting | Value |
|---------|-------|
| Indent style | Spaces |
| Indent width | 2 |
| Line width | 80 |
| Quote style | Single |
| Trailing commas | ES5 |
| Semicolons | Always |

Key linter rules:

| Rule | Severity |
|------|----------|
| `noExplicitAny` | Error |
| `noConsole` | Error |
| `noUnusedImports` | Error |
| `noParameterAssign` | Error |

## Nx Configuration

Task caching:

| Task | Cached | Dependencies |
|------|--------|--------------|
| `build` | Yes | `^build` |
| `test` | Yes | `^build` |
| `check` | Yes | `^check` |
| `types` | Yes | `^build`, `^types` |
| `dev` | No | - |
| `validate` | No | - |

## TypeScript Configuration

Base configuration (all packages extend):

| Setting | Value |
|---------|-------|
| Target | ES2022 |
| Module | ESNext |
| Module resolution | Bundler |
| Strict mode | Enabled |
| Declaration maps | Enabled |

Path aliases:

```json
{
  "paths": {
    "#/*": ["./src/*"]
  }
}
```

## Versioning

| Tool | Purpose |
|------|---------|
| Changesets | Version management and changelogs |
| syncpack | Dependency version synchronization |
