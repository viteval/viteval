# Contributing to Viteval

Thank you for your interest in contributing to Viteval! This document provides guidelines for contributing to the project.

> **Detailed Documentation**: For in-depth contributor documentation, see the [docs/](./docs/) directory.

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/viteval.git
   cd viteval
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

> **More details**: See [docs/guides/setup-local-env.md](./docs/guides/setup-local-env.md)

## Project Structure

This is a monorepo managed with Nx and pnpm workspaces:

- `packages/core/` - Core evaluation framework
- `packages/cli/` - CLI implementation
- `packages/viteval/` - Main package that re-exports core functionality
- `packages/internal/` - Internal utilities
- `tools/` - Development tools and generators
- `examples/` - Example projects
- `docs/` - Contributor documentation

> **More details**: See [docs/structure.md](./docs/structure.md)

## Development Workflow

### Running Scripts

The project uses Nx for task orchestration. Common commands:

```bash
# Development mode (watch)
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm types

# Linting and formatting
pnpm check
pnpm fix

# Validate all packages
pnpm validate
```

### Code Quality

We use Biome for linting and formatting:

- **Formatter**: 2 spaces, single quotes, trailing commas (ES5), semicolons
- **Linter**: Strict rules including no `console.log`, no unused imports, no explicit `any`

Run `pnpm check` to lint and `pnpm fix` to auto-fix issues.

> **More details**: See [docs/tooling/biome.md](./docs/tooling/biome.md)

## Making Changes

### Branching

- Create feature branches from `main`
- Use descriptive branch names (e.g., `feat/add-custom-scorer`, `fix/cli-config-bug`)

### Commit Messages

While we don't enforce conventional commits, we encourage descriptive commit messages that explain:
- What changed
- Why it changed
- Any breaking changes

### Adding Dependencies

When adding new dependencies:

1. Add to the appropriate package's `package.json`
2. Run `pnpm install` from the root
3. Ensure the dependency is necessary and well-maintained

### Testing

- Write tests for new features and bug fixes
- Tests are located alongside source files (`.test.ts`)
- Run `pnpm test` to execute all tests
- Use `pnpm test --watch` for development

> **More details**: See [docs/testing.md](./docs/testing.md)

## Release Process

We use [Changesets](https://github.com/changesets/changesets) for version management and releases.

### Creating a Changeset

When making changes that should be included in a release:

```bash
npx changeset
```

This will:
1. Prompt you to select which packages are affected
2. Ask for the type of change (major, minor, patch)
3. Request a description of the changes

### Publishing

Releases are handled by maintainers:

```bash
# Update versions based on changesets
pnpm version

# Build and publish to npm
pnpm publish
```

## Pull Request Guidelines

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following the coding standards
4. **Add tests** for new functionality
5. **Add a changeset** if your changes affect published packages
6. **Ensure all checks pass**:
   ```bash
   pnpm check    # Lint and format
   pnpm types    # Type checking
   pnpm test     # Run tests
   pnpm build    # Ensure builds succeed
   ```
7. **Create a pull request** with:
   - Clear title and description
   - Reference any related issues
   - Include screenshots/examples if UI changes

## Package Development

### Creating New Packages

Use the Nx generator to scaffold new packages:

```bash
npx nx generate @tools/core:package my-new-package
```

This creates a properly configured package with:
- TypeScript configuration
- Build setup with tsup
- Testing with Vitest
- Linting configuration

### Package Structure

Each package should follow this structure:

```
packages/my-package/
├── src/
│   ├── index.ts          # Main export
│   └── lib/
│       └── feature.ts    # Implementation files
├── package.json
├── tsconfig.json
├── tsup.config.ts        # Build configuration
└── vitest.config.ts      # Test configuration
```

## Documentation

- Update relevant documentation when making changes
- API documentation is generated from JSDoc comments
- Add examples for new features
- Update README.md if needed

## Getting Help

- Check existing [issues](https://github.com/your-org/viteval/issues)
- Create a new issue for bugs or feature requests
- Join our community discussions

## License

By contributing to Viteval, you agree that your contributions will be licensed under the same license as the project.