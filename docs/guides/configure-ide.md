# Configure IDE

Set up your IDE for Viteval development.

## Prerequisites

- VS Code, Cursor or IDE that supports VS Code extensions

## Steps 

### 1. Install recommended extensions

- **Biome** - Linting and formatting
- **TypeScript** - Language support

### 2. Configure settings

Create or update `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome"
}
```

### 3. Enable TypeScript workspace version

1. Open any `.ts` file
2. Click TypeScript version in status bar
3. Select "Use Workspace Version"

## References

- [Setup Local Environment](./setup-local-env.md) - Initial setup
- [Biome Documentation](https://biomejs.dev)
