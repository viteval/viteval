# Development Lifecycle

High-level overview of our Software Development Lifecycle (SDLC). This is your starting point - see linked standards and guides for detailed information.

## Workflow

We use **trunk-based development** with short-lived feature branches:

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#6c7086',
    'lineColor': '#89b4fa',
    'secondaryColor': '#45475a',
    'tertiaryColor': '#1e1e2e',
    'background': '#1e1e2e',
    'mainBkg': '#313244'
  },
  'flowchart': { 'curve': 'basis', 'padding': 15 }
}}%%
flowchart LR
    A(["Branch"]) --> B(["Develop"])
    B --> C(["Validate"])
    C --> D(["Create PR"])
    D --> E(["Review"])
    E --> F(["Merge"])
    F --> G(["Deploy"])

    classDef default fill:#313244,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
```

1. **Branch** - Create feature branch from `main`
2. **Develop** - Write code following standards
3. **Validate** - Run `pnpm validate` locally
4. **PR** - Create pull request with labels
5. **Review** - Code review and approval
6. **Merge** - Squash and merge to `main`
7. **Deploy** - Automatic deployment

## Standards

We follow specific standards for code quality and consistency:

| Standard          | Description                   | Link                                                          |
| ----------------- | ----------------------------- | ------------------------------------------------------------- |
| **Commits**       | Conventional commit format    | [Commit Standards](standards/git-commits.md)                  |
| **TypeScript**    | Code patterns and conventions | [TypeScript Standards](standards/typescript/overview.md)      |
| **Documentation** | Doc structure and style       | [Documentation Standards](standards/documentation/writing.md) |
| **Testing**       | Testing patterns              | [Testing Standards](standards/testing.md)                     |

## Validation

All code must pass validation before merging:

```bash
pnpm validate  # Run all checks (lint, format, typecheck, test)
pnpm fix       # Auto-fix linting and formatting issues
```

See [commands.md](commands.md) for all available commands.

## Guides

Step-by-step guides for common tasks:

| Task              | Guide                                                |
| ----------------- | ---------------------------------------------------- |
| Setup environment | [Setup Local Environment](guides/setup-local-env.md) |
| Add a feature     | [Add Feature](guides/add-feature.md)                 |
| Add a test        | [Add Test](guides/add-test.md)                       |
| Commit changes    | [Commit Changes](guides/commit-changes.md)           |

## Quick Reference

| Item            | Value                    |
| --------------- | ------------------------ |
| Package manager | pnpm 10.x                |
| Build system    | Nx + tsdown              |
| Language        | TypeScript (strict mode) |
| Node version    | 22.x                     |
| Main branch     | `main`                   |
| Merge strategy  | Squash and merge         |
