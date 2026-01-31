# Troubleshooting Template

Copy-paste template for creating troubleshooting documentation.

**Location:** `docs/troubleshooting/`

---

```markdown
# Domain Troubleshooting

Common issues and fixes for [domain].

## Issue Name

Brief symptoms description (1 line).

**Fix:**

\`\`\`bash
solution-command
\`\`\`

## Another Issue

Brief symptoms description.

**Cause:** Why this happens (optional, keep short).

**Fix:**

1. First step
2. Second step

## Error: Specific Error Message

When you see this error:

\`\`\`
Error: Something went wrong
\`\`\`

**Fix:**

Explanation or command.

## Issue with Multiple Solutions

Brief symptoms.

**Option A:** Quick fix

\`\`\`bash
quick-fix-command
\`\`\`

**Option B:** Full reset

\`\`\`bash
full-reset-command
\`\`\`

## References

- [Related Guide](../guides/related.md)
- [Commands](../commands.md)
```

---

## Rules

- H2 is the issue name (creates linkable anchors)
- Keep symptoms to 1 line
- Keep fixes short - command or 1-2 sentences
- No background explanations (link to concepts if needed)
- Group related issues together
- Include exact error messages when applicable

## Issue Naming

| Good                        | Bad                 |
| --------------------------- | ------------------- |
| `Connection refused`        | `Database problems` |
| `Module not found: @pkg/ai` | `Import errors`     |
| `Scorer returned undefined` | `Scoring issues`    |
| `Evaluation timeout`        | `It's slow`         |

## References

- [Writing Standards](./writing.md)
