# Configure AI Coding

Set up AI-assisted development for Viteval using Claude Code.

> [!NOTE]
> This setup is optimized for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Other AI coding tools (Cursor, Copilot, etc.) are not officially supported.

## Prerequisites

- Claude Code CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code/getting-started))
- Python 3.11+ with `uvx` available (for Serena MCP)
- Local environment set up ([Setup Local Environment](./setup-local-env.md))

## Overview

The AI coding setup consists of:

| Component | Location | Purpose                          |
| --------- | -------- | -------------------------------- |
| CLAUDE.md | Root     | Entry point for Claude Code      |
| AGENTS.md | Root     | Project context and instructions |
| .mcp.json | Root     | MCP server configuration         |
| .serena/  | Root     | Serena project configuration     |

## Steps

### 1. Understand the configuration files

**CLAUDE.md** - Entry point that Claude Code reads automatically:

```md
Always read the `AGENTS.md` in the root of the repository and apply the instructions to the current task.
```

**AGENTS.md** - Contains project context, commands, and development guidelines. Claude Code reads this to understand how to work with the codebase.

### 2. Configure Serena MCP

Serena provides semantic code navigation and editing tools. The configuration is in `.mcp.json`:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--context",
        "claude-code",
        "--project-from-cwd",
        "--open-web-dashboard",
        "false"
      ]
    }
  }
}
```

This starts Serena as an MCP server when Claude Code runs.

### 3. Understand Serena project configuration

The `.serena/project.yml` file configures how Serena analyzes the codebase:

```yaml
project_name: 'viteval'

languages:
  - typescript
  - markdown

encoding: 'utf-8'

ignore_all_files_in_gitignore: true

ignored_paths:
  - node_modules
  - dist
  - .nx
  - coverage
```

Key settings:

- **languages** - Language servers to enable
- **ignored_paths** - Paths excluded from analysis
- **initial_prompt** - Context shown when project activates

### 4. Work with Serena memories

Serena maintains project-specific memories in `.serena/memories/`:

| Memory                         | Purpose                        |
| ------------------------------ | ------------------------------ |
| `project_overview.md`          | High-level project description |
| `style_and_conventions.md`     | Code style guidelines          |
| `suggested_commands.md`        | Common commands reference      |
| `task_completion_checklist.md` | Pre-commit checklist           |

These memories provide persistent context across Claude Code sessions.

### 5. Start Claude Code

```bash
cd viteval
claude
```

Claude Code will:

1. Read CLAUDE.md and AGENTS.md
2. Start the Serena MCP server
3. Have access to semantic code tools

## Serena Tools

Serena provides these capabilities:

| Tool                       | Use Case                                 |
| -------------------------- | ---------------------------------------- |
| `find_symbol`              | Find classes, functions, methods by name |
| `get_symbols_overview`     | Get file structure overview              |
| `find_referencing_symbols` | Find usages of a symbol                  |
| `replace_symbol_body`      | Edit symbol implementations              |
| `search_for_pattern`       | Regex search across codebase             |

## Best Practices

### Do

- Let Claude Code use Serena tools for code navigation
- Keep AGENTS.md updated with project conventions
- Use Serena memories for persistent context
- Run `pnpm validate` before accepting changes

### Don't

- Manually edit `.serena/cache/` files
- Commit Serena cache files (already in `.gitignore`)
- Rely on Claude Code for git operations without review

## Work in Progress

> [!WARNING]
> The following features are planned but not yet implemented.

### Custom hooks

Custom pre/post operation hooks for validation.

### Workspace-level configuration

Multi-project workspace support.

### Memory auto-generation

Automatic memory updates based on codebase changes.

## Troubleshooting

### Serena fails to start

Ensure `uvx` is available:

```bash
which uvx
# Should show path to uvx
```

If missing, install pipx and uvx:

```bash
pip install pipx
pipx ensurepath
```

### Serena cache issues

Reset the Serena cache:

```bash
rm -rf .serena/cache
```

### MCP connection issues

Check that `.mcp.json` is valid JSON and the server configuration is correct.

## References

- [Setup Local Environment](./setup-local-env.md) - Initial setup
- [Configure IDE](./configure-ide.md) - VS Code setup
- [Serena Documentation](https://oraios.github.io/serena/) - Full Serena docs
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) - Claude Code docs
