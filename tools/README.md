# Tools

Internal tools for building, maintaining, testing, and publishing Viteval packages.

## Getting Started

The repository uses [Turborepo](https://turborepo.com) for task orchestration and code generation.

## Generators

#### `generate-package`

You can generate a new package by running:

```bash
pnpm gen package --args my-package "Package description"
```

This will create a new package (e.g. `my-package`) in the `packages` directory.

#### `generate-example`

You can generate a new example project by running:

```bash
pnpm gen example --args my-example "Example description"
```

This will create a new example project (e.g. `my-example`) in the `examples` directory.
