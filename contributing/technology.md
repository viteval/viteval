# Technology Stack

Technologies and dependencies used in the Viteval codebase.

## Requirements

- Node.js >= 26.0.0
- pnpm >= 12.0.0

## Core Technologies

| Technology | Version | Purpose                          |
| ---------- | ------- | -------------------------------- |
| TypeScript | ~7.0.x  | Type-safe JavaScript             |
| Vitest     | ^5.0.x  | Test runner (evals run as tests) |
| pnpm       | 12.x    | Package manager                  |
| Turborepo  | ^2.11.x | Monorepo task orchestration      |

## Build Tools

| Tool   | Version | Purpose                             |
| ------ | ------- | ----------------------------------- |
| tsdown | ^0.23.x | TypeScript bundler (Rolldown-based) |
| SWC    | ~1.16.x | Fast TypeScript compilation         |
| Vite   | ^8.3.x  | Development server and bundling     |

## Code Quality

| Tool       | Version | Purpose       |
| ---------- | ------- | ------------- |
| oxlint     | ^1.87.x | Linting       |
| oxfmt      | ^0.72.x | Formatting    |
| TypeScript | ~7.0.x  | Type checking |

## Key Dependencies

### @viteval/core

| Dependency | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `vitest`   | Test runner integration                             |
| `ai`       | AI SDK model integration                            |
| `massaman` | Results, functional utilities, and pattern matching |
| `zod`      | Schema validation                                   |
| `js-yaml`  | YAML config parsing                                 |

### @viteval/internal

| Dependency  | Purpose                   |
| ----------- | ------------------------- |
| `type-fest` | TypeScript type utilities |

### @viteval/cli

| Dependency | Purpose                                  |
| ---------- | ---------------------------------------- |
| `maltty`   | Command definitions and argument parsing |
| `consola`  | CLI output                               |
| `glob`     | Dataset file discovery                   |
| `ink`      | Interactive terminal UI                  |

### @viteval/ui

| Dependency               | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `react`                  | UI framework (v19)                      |
| `@tanstack/react-start`  | Server rendering and server routes      |
| `@tanstack/react-router` | Typed file routes and navigation        |
| `@tanstack/react-table`  | Data tables                             |
| `vite`                   | Development server and client/SSR build |
| `tailwindcss`            | Styling (v4)                            |
| `hono`                   | Packaged Node request/static bridge     |
| `@hono/node-server`      | Node HTTP adapter                       |

The UI build ships `dist/client`, `dist/server`, and the public `server.mjs` /
`server.d.mts` launcher. Turbo caches these outputs. Generated route types must
be available before UI typechecking, including when restoring a cached build.

## Documentation

The public documentation uses Ciderpress from the repository root. Content lives
in `docs/`, static assets in `public/`, and generated build output in
`.ciderpress/dist/`. GitHub Pages deploys that static output to `viteval.dev`.

## Oxc Configuration

Formatting rules:

| Setting         | Value  |
| --------------- | ------ |
| Indent style    | Spaces |
| Indent width    | 2      |
| Line width      | 80     |
| Quote style     | Single |
| Trailing commas | ES5    |
| Semicolons      | Always |

Key linter rules:

| Rule              | Severity |
| ----------------- | -------- |
| `no-explicit-any` | Error    |
| `no-console`      | Error    |
| `no-unused-vars`  | Error    |
| `no-var`          | Error    |
| `eqeqeq`          | Error    |

## Turborepo Configuration

Task caching:

| Task    | Cached | Dependencies       |
| ------- | ------ | ------------------ |
| `build` | Yes    | `^build`           |
| `test`  | Yes    | `^build`           |
| `types` | Yes    | `^build`, `^types` |
| `dev`   | No     | -                  |

## TypeScript Configuration

Base configuration (all packages extend):

| Setting           | Value   |
| ----------------- | ------- |
| Target            | ES2024  |
| Module            | ESNext  |
| Module resolution | Bundler |
| Strict mode       | Enabled |
| Declaration maps  | Enabled |

Path aliases:

```json
{
  "paths": {
    "#/*": ["./src/*"]
  }
}
```

## Versioning

| Tool       | Purpose                            |
| ---------- | ---------------------------------- |
| Changesets | Version management and changelogs  |
| syncpack   | Dependency version synchronization |
