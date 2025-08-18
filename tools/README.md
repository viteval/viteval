# ⚒️ Tools

Internal tools for building, maintaining, testing, and publishing VoltAgent packages.

## Getting Started

We (primarily) use [nx](https://nx.dev) plugins for our tooling.

## `nx` plugins

You can see a full list of the nx plugins (our primary interface for tooling) by running:

```bash
pnpm nx list core
```

### Generators

#### `generate-package`

You can generate a new package by running:

```bash
pnpm nx generate core:package my-package
```

This will create a new package (e.g. `my-package`) in the `packages` directory.

#### `generate-example`

You can generate a new example project by running:

```bash
pnpm nx generate core:example my-example
```

This will create a new example project (e.g. `my-example`) in the `examples` directory.
