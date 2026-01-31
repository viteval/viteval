# Configure IDE

Set up your IDE for Viteval development.

## Prerequisites

- VS Code, Cursor or IDE that supports VS Code extensions

## Steps

### 1. Install recommended extensions

- **Oxc** - Linting (oxlint) and formatting (oxfmt)
- **TypeScript** - Language support

### 2. Configure settings

Create or update `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "explicit"
  }
}
```

### 3. Enable TypeScript workspace version

1. Open any `.ts` file
2. Click TypeScript version in status bar
3. Select "Use Workspace Version"

## Verification

Verify Oxc extension is working:

1. Open a `.ts` file with a lint error (e.g., unused variable)
2. Check that the error is underlined and shown in Problems panel

Verify formatting works:

1. Make a formatting change (e.g., add extra spaces)
2. Save the file
3. Check that formatting is automatically corrected

Verify TypeScript is using workspace version:

1. Open a `.ts` file
2. Check status bar shows TypeScript version matching `pnpm tsc --version`

## Troubleshooting

### Oxc extension not formatting

**Issue:** Files are not formatted on save.

**Fix:** Ensure Oxc is set as the default formatter:

1. Open Command Palette (Cmd+Shift+P)
2. Run "Format Document With..."
3. Select "Configure Default Formatter..."
4. Choose "Oxc"

### TypeScript errors not showing

**Issue:** IDE doesn't show TypeScript errors.

**Fix:** Ensure TypeScript extension is installed and using workspace version:

1. Check Extensions panel for "TypeScript and JavaScript Language Features"
2. Reload window (Cmd+Shift+P -> "Developer: Reload Window")

### Conflicting formatters

**Issue:** Multiple formatters fighting over file formatting.

**Fix:** Disable other formatters (Prettier, ESLint formatting):

```json
{
  "prettier.enable": false,
  "eslint.format.enable": false,
  "editor.defaultFormatter": "oxc.oxc-vscode"
}
```

## References

- [Setup Local Environment](./setup-local-env.md) - Initial setup
- [Configure Coding Agents](./configure-coding-agents.md) - Coding agents setup
- [Oxc Documentation](https://oxc.rs)
