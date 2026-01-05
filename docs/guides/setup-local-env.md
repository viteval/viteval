# Setup Local Environment

Get the Viteval development environment running.

## Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0
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

## Troubleshooting

### pnpm version mismatch

```bash
corepack enable
corepack prepare pnpm@10.14.0 --activate
```

### Node version mismatch

```bash
nvm use 22
```

### Build failures

```bash
rm -rf node_modules packages/*/dist
pnpm install && pnpm build
```

## References

- [Configure IDE](./configure-ide.md) - Set up VS Code
- [Commit Changes](./commit-changes.md) - Validate and commit workflow
