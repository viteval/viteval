# How to configure AI coding agents

How we approach AI-assisted development in this project.

> [!WARNING]
> Some tooling referenced here (X-Plugin, UnMCP CLI, Tim CLI) is part of the **Jogger Agent Harness**, a proprietary internal system not publicly available. See [Proprietary Tooling](#proprietary-tooling) for details.

## Philosophy

AI coding is a first-class workflow in Viteval. We optimize for:

- **Agent-friendly codebase** - Clear structure, consistent patterns, comprehensive documentation
- **Semantic tooling** - LSP-powered code navigation over text-based search
- **Persistent context** - Project memories and conventions that survive across sessions
- **Validation gates** - Automated checks before accepting AI-generated changes

## Supported Tools

### Claude Code (Primary)

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is our primary AI coding tool. The codebase is optimized for Claude Code's capabilities:

- `CLAUDE.md` - Entry point with documentation index
- `AGENTS.md` - Project context and conventions for AI agents
- `.claude/` - Skills, agents, and hooks for Claude Code

### Serena MCP

[Serena](https://oraios.github.io/serena/) provides semantic code intelligence via the Model Context Protocol (MCP):

- LSP-powered symbol navigation
- Semantic code editing (replace/insert at symbol boundaries)
- Project memories for persistent context
- Configured in `.mcp.json` and `.serena/`

### Other Tools

Cursor, GitHub Copilot, and other AI coding tools are not officially supported but may work with the standard documentation files.

## Configuration Files

| File/Directory | Purpose                            |
| -------------- | ---------------------------------- |
| `CLAUDE.md`    | Entry point for Claude Code        |
| `AGENTS.md`    | Project context for AI agents      |
| `.mcp.json`    | MCP server configuration           |
| `.claude/`     | Claude Code skills, agents, hooks  |
| `.serena/`     | Serena project config and memories |

## Workflow

### Starting a Session

```bash
cd viteval
claude
```

Claude Code automatically:

1. Reads `CLAUDE.md` and `AGENTS.md`
2. Starts configured MCP servers (Serena)
3. Loads project memories and context

### During Development

- Use Serena tools for code navigation and editing
- Follow project conventions in `AGENTS.md`
- Run `pnpm validate` before accepting changes

### Ending a Session

- Verify changes with `pnpm validate`
- Review diffs before committing
- Use conventional commit messages

## Proprietary Tooling

> [!IMPORTANT]
> The following tools are part of the **Jogger Agent Harness**, a proprietary internal system developed by the Jogger team. These tools are not publicly available.

### What's Proprietary

| Tool      | Description                                                |
| --------- | ---------------------------------------------------------- |
| X-Plugin  | Claude Code plugin for extended capabilities               |
| UnMCP CLI | Unified MCP client for GitHub, Linear, Vercel integrations |
| Tim CLI   | Internal task and workflow management                      |

### Why It's Not Public

The Jogger Agent Harness is an internal system that:

- Integrates with proprietary infrastructure
- Contains organization-specific workflows
- Requires internal authentication systems

### For External Contributors

If you're an engineer from another company interested in:

- Learning more about the Jogger Agent Harness
- Exploring similar tooling for your organization
- Contributing to Viteval with enhanced AI capabilities

**Contact the Jogger team** - the primary maintainers of Viteval. Reach out via:

- GitHub Issues: [viteval/viteval](https://github.com/viteval/viteval/issues)
- Email: team@joggr.io

## Best Practices

### Do

- Let AI use semantic tools (Serena) for code operations
- Keep `AGENTS.md` updated with project conventions
- Run validation before accepting AI changes
- Review all AI-generated code before committing

### Don't

- Rely on AI for git operations without review
- Skip validation steps
- Commit AI-generated code without understanding it
- Share proprietary tooling credentials

## References

- [Configure Coding Agents](./guides/configure-coding-agents.md) - Step-by-step setup
- [Serena Documentation](https://oraios.github.io/serena/) - Serena MCP docs
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) - Claude Code docs
