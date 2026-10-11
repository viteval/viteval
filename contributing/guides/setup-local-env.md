# Setup Local Environment

Get the Viteval development environment running.

## Prerequisites

- Node.js >= 26.0.0
- pnpm >= 12.0.0
- Git (any recent version)

## Steps

### 1. Clone the repository

```bash
git clone https://github.com/viteval/viteval.git
cd viteval
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Build packages

```bash
pnpm build
```

### 4. Run tests

```bash
pnpm test
```

### 5. Run type check

```bash
pnpm types
```

### 6. Run linting

```bash
pnpm check
```

### 7. Create environment file (optional)

Create `.env.local` for LLM-based features:

```bash
OPENAI_API_KEY=sk-...
VITEVAL_DEBUG_MODE=true
```

### 8. Start the dashboard

```bash
pnpm dev:ui examples/basic
```

Open `http://localhost:6274`. TanStack Start runs on Vite and reads the selected
project's `.viteval` directory. Build and run the example first to populate
results. Use `pnpm validate:consumer` to check the packaged production server and
`pnpm validate:browser` for hydration, navigation, and tagging in Orca.

## Troubleshooting

### pnpm version mismatch

```bash
corepack enable
corepack prepare pnpm@12.11.2 --activate
```

### Node version mismatch

```bash
nvm use 26
```

### Build failures

```bash
rm -rf node_modules packages/*/dist
pnpm install && pnpm build
```

## References

- [Configure IDE](./configure-ide.md) - Set up VS Code
- [Commit Changes](./commit-changes.md) - Validate and commit workflow
