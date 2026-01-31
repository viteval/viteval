# Configure AI Coding

Set up AI-assisted development for Viteval.

> [!NOTE]
> This setup is optimized for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). See [AI-CODING.md](../../AI-CODING.md) for our AI coding philosophy and approach.

> [!WARNING]
> Some internal tooling (X-Plugin, UnMCP CLI, Tim CLI) referenced in configuration files is part of the **Jogger Agent Harness** and is not publicly available. External contributors can use the core setup without these tools.

## Prerequisites

- Claude Code CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code/getting-started))
- Python 3.11+ with `uvx` available (for Serena MCP)
- Local environment set up ([Setup Local Environment](./setup-local-env.md))

## Steps

### 1. Verify uvx is available

```bash
which uvx
```

If missing, install pipx:

```bash
pip install pipx
pipx ensurepath
```

### 2. Review the configuration files

The AI coding setup consists of:

- `CLAUDE.md` - Entry point for Claude Code
- `AGENTS.md` - Project context and conventions
- `.mcp.json` - MCP server configuration (Serena)
- `.serena/` - Serena project config and memories

### 3. Start Claude Code

```bash
cd viteval
claude
```

Claude Code will automatically:

- Read `CLAUDE.md` and `AGENTS.md`
- Start the Serena MCP server
- Load project memories from `.serena/memories/`

### 4. Verify Serena is running

In Claude Code, the Serena tools should be available. Test with:

```
Use the find_symbol tool to find the "evaluate" function
```

### 5. Run a validation check

Before ending any session, verify changes:

```bash
pnpm validate
```

## Troubleshooting

### Serena fails to start

Reset the Serena cache:

```bash
rm -rf .serena/cache
```

### MCP connection issues

Verify `.mcp.json` is valid:

```bash
cat .mcp.json | jq .
```

### uvx not found

Ensure pipx bin directory is in PATH:

```bash
pipx ensurepath
source ~/.bashrc  # or ~/.zshrc
```

## References

- [AI-CODING.md](../../AI-CODING.md) - AI coding philosophy and proprietary tooling details
- [Setup Local Environment](./setup-local-env.md) - Initial setup
- [Serena Documentation](https://oraios.github.io/serena/) - Full Serena docs
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) - Claude Code docs
