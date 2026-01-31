# Documentation Writing Standards

Standards for writing clear, actionable documentation.

## Core Principles

- **Succinct** - No fluff, get to the point
- **Actionable** - Lead with what to do, not background
- **Scannable** - Tables, headers, and lists over paragraphs
- **Consistent** - Use the same structure and formatting for all documentation
- **Audience-first** - Write for the reader, not the writer

## Document Types

| Type            | Description                                     | Template                                                   |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Guides          | Step-by-step instructions for completing a task | [writing-guides.md](./writing-guides.md)                   |
| Overview        | Conceptual introduction to a topic              | [writing-overview.md](./writing-overview.md)               |
| Standards       | Rules and conventions for the codebase          | [writing-standards.md](./writing-standards.md)             |
| Troubleshooting | Common issues and fixes                         | [writing-troubleshooting.md](./writing-troubleshooting.md) |

### Guides

Step-by-step instructions for completing a task.

**Location:** `docs/guides/`

**Rules:**

- Title starts with verb (Add, Create, Setup, Run, Debug, Write, Configure)
- Steps are numbered
- Include Prerequisites, Verification, and Troubleshooting sections
- Link to reference docs for detailed options

### Overview

Conceptual introduction to a topic.

**Location:** `docs/concepts/`

**Rules:**

- Explain "what" and "why" briefly
- Show "how" with focused examples
- Include architecture diagram if applicable
- Link to guides for step-by-step instructions

### Standards

Rules and conventions for the codebase.

**Location:** `docs/standards/`

**Rules:**

- Clear rules with examples
- Good/bad comparisons
- Enforcement mechanisms documented

### Troubleshooting

Common issues and fixes.

**Location:** `docs/troubleshooting/`

**Rules:**

- H2 is the issue (linkable via anchor)
- Keep fixes short - command or 1-2 sentences
- No background explanations

## Related Standards

| Standard                           | Description                              |
| ---------------------------------- | ---------------------------------------- |
| [Formatting](./formatting.md)      | Code examples, tables, markdown          |
| [Diagrams](./diagrams.md)          | Mermaid diagram standards and templates  |

## Common Sections

Add these sections to any doc as needed.

### Resources

Link to external documentation at the end of a doc:

```markdown
## Resources

- [Vitest Documentation](https://vitest.dev)
- [pnpm Documentation](https://pnpm.io)
```

### Troubleshooting (Inline)

For docs that aren't dedicated troubleshooting files, add a section at the end:

```markdown
## Troubleshooting

### Short & descriptive issue name

Brief description of the issue.

**Fix:** Solution command or explanation.
```

### References

Link to related internal documentation or external resources:

```markdown
## References

- [Testing](../testing.md) - Testing patterns and conventions
- [Commands](../../commands.md) - Development commands
- [Vitest](https://vitest.dev) - Test framework documentation
```

## References

- [Formatting Standards](./formatting.md)
- [Diagram Standards](./diagrams.md)
