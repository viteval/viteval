# Documentation Standards

How we write documentation for this project.

## Principles

- **Succinct** - No fluff, get to the point
- **Actionable** - Lead with what to do, not background
- **Scannable** - Tables, headers, and lists over paragraphs

## Document Types

### Published site (`docs/`)

Use the core templates below, rendered with Ciderpress built-ins. Match the
structure of other pages of the same type; do not give each guide its own layout.

- Every published page has frontmatter with `title` and `description`.
- Standard pages have one H1 and a short opening description. Only the landing,
  features, and brand pages use `pageType: custom` and custom layouts.
- MDX guides import `Steps` and `Step` from `@theme`. Use one flat `<Steps>` group
  under `## Steps`; each `<Step title="...">` starts with a verb. Ciderpress supplies
  the numbering, so do not put numbers in step titles.
- API references use `FieldGroup` and `Field` from `@theme` for option contracts.
  Keep option names, types, required markers, and defaults consistent.
- End standard guides, concepts, API references, and CLI references with
  `## References` linking to related pages. Use site-absolute routes in `docs/`;
  contributor docs keep relative file links.

| Page type                                    | Required structure                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Guides (`docs/guide/*.mdx`, getting started) | Prerequisites → Steps → Verification → Troubleshooting → References                                                |
| Function API references                      | Import → Signature → Parameters; include an Example and Return value (or Return value and errors), then References |
| Configuration, provider, and scorer catalogs | Import when applicable, grouped settings or contracts, focused examples, References                                |
| CLI references (`docs/cli/*.md`)             | Usage → Arguments (when applicable) → Options; include Examples, then References                                   |
| Concepts (`docs/concepts/*.md`)              | Short definition, focused topic sections, minimal examples where useful, References                                |

Extra reference sections may appear between required sections when the task
needs them (for example, backend setup in the storage guide). Keep procedural
instructions inside the numbered steps. Do not add empty sections just to match
a template.

Verification names the expected outcome, not just the command to run. Migration
and storage guides use checklists for the checks spanning multiple systems.
Troubleshooting describes current APIs; do not restore removed initialization,
runner configuration, or reporter APIs from older docs.

Run `pnpm docs:check`, `pnpm docs:build`, and `pnpm validate` after changes. The
docs build runs `scripts/docs-contract.test.mjs` to check metadata, page templates,
and removed-API regressions.

### Guides (`guides/*.md`)

Step-by-step instructions for completing a task.

**Structure:**

```markdown
# Action Title (e.g., "Add a Feature")

One-line description.

## Steps

### 1. Do Thing

Brief explanation.

\`\`\`bash
command here
\`\`\`

### 2. Do Next Thing

...
```

**Rules:**

- Title starts with verb (Add, Create, Setup)
- One guide = one task (split multi-task guides)
- Steps are flat and numbered (1, 2, 3), not nested
- Prerequisites use bullets, not tables
- Link to reference docs for detailed options

**Bad (nested steps):**

```markdown
## Planning

### Step 1: Identify package

### Step 2: Design API

## Implementation

### Step 1: Create directory
```

**Good (flat steps):**

```markdown
### 1. Identify the target package

### 2. Design the public API

### 3. Create feature directory
```

### Overview Docs (`{topic}/overview.md`)

Conceptual introduction to a topic.

**Structure:**

```markdown
# Topic Name

One-line description.

## Architecture

Diagram and explanation.

## Usage

### Subtopic A

Explanation with minimal code example.

## Related Docs

Links to related documentation.
```

**Rules:**

- Explain "what" and "why" briefly
- Show "how" with focused examples
- Link to guides for step-by-step instructions

### Troubleshooting (`{topic}/troubleshooting.md`)

Common issues and fixes.

**Structure:**

```markdown
# Troubleshooting

## Issue Name

Symptoms (1 line).

**Fix:**

\`\`\`bash
solution command
\`\`\`

Or brief explanation.
```

**Rules:**

- H2 is the issue (linkable via anchor)
- Keep fixes short - command or 1-2 sentences
- No background explanations

## Code Examples

### Default: Minimal

Show only the critical parts. Omit imports, boilerplate, and obvious code.

**Good:**

This example is focused on the API.

```ts
const result = evaluate('my-eval', {
  data: testData,
  task: myTask,
  scorers: [myScorer],
});
```

**Bad:**

This example is too noisy and the reader is distracted by the boilerplate and obvious code.

```ts
import { evaluate, createScorer } from '@viteval/core';
import { defineDataset } from '@viteval/core/dataset';

const testData = [{ input: 'hello', expected: 'HELLO' }];

const myTask = async ({ input }) => {
  return input.toUpperCase();
};

const myScorer = createScorer({
  name: 'exact-match',
  score: ({ output, expected }) => ({
    score: output === expected ? 1.0 : 0.0,
  }),
});

const result = evaluate('my-eval', {
  data: testData,
  task: myTask,
  scorers: [myScorer],
});
```

### Exception: Copy-Paste Templates

When the reader should copy the entire block, show everything:

```ts
// Full file template - reader copies this
import { evaluate, createScorer } from 'viteval';

const data = [
  { input: 'hello', expected: 'HELLO' },
  { input: 'world', expected: 'WORLD' },
];

evaluate('uppercase-eval', {
  data,
  task: async ({ input }) => input.toUpperCase(),
  scorers: [
    createScorer({
      name: 'exact-match',
      score: ({ output, expected }) => ({
        score: output === expected ? 1.0 : 0.0,
      }),
    }),
  ],
});
```

### Rules

- No inline comments unless explaining non-obvious logic
- No `// ...` or placeholder code
- Use real values, not `foo`/`bar`/`example`
- Show imports only when they're the point of the example

## Diagrams

**Use Mermaid for all diagrams.** GitHub and most markdown renderers support them natively.

### Flowcharts

For system architecture and data flow:

```markdown
\`\`\`mermaid
flowchart LR
A[Start] --> B[Process]
B --> C[End]
\`\`\`
```

### Sequence Diagrams

For request/response flows and interactions:

```markdown
\`\`\`mermaid
sequenceDiagram
participant CLI
participant Core
participant Scorer
CLI->>Core: evaluate()
Core->>Scorer: score()
Scorer-->>Core: result
Core-->>CLI: results
\`\`\`
```

### Entity Relationships

For data models:

```markdown
\`\`\`mermaid
erDiagram
Evaluation ||--o{ DataItem : contains
Evaluation ||--|{ Scorer : uses
DataItem ||--o{ Score : produces
\`\`\`
```

### Rules

- Always use Mermaid, never ASCII art
- Keep diagrams simple - max 10-15 nodes
- Use clear, short labels
- Left-to-right (LR) or top-to-bottom (TB) orientation

## Formatting

### Alerts

Use [GFM alerts](https://github.com/orgs/community/discussions/16925) for callouts:

```markdown
> [!TIP]
> First complete [Setup Guide](./setup.md)

> [!NOTE]
> This only applies to packages in the monorepo.

> [!WARNING]
> This will delete all local changes.
```

### Tables

Use tables for structured information (not for prerequisites):

| Item   | Description |
| ------ | ----------- |
| First  | Description |
| Second | Description |

### Code Blocks

Always specify language for syntax highlighting:

```ts
const example = 'typescript';
```

```bash
echo "shell commands"
```

### Links

- Use relative links for internal docs: `[Testing](./testing.md)`
- Use full URLs for external: `[Vitest](https://vitest.dev)`

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

### Issue name

Brief description.

**Fix:** Solution command or explanation.
```

### References

Link to related internal documentation or external resources:

```markdown
## References

- [Testing](./testing.md) - Testing patterns and conventions
- [Commands](./commands.md) - Development commands
- [Vitest](https://vitest.dev) - Test framework documentation
```
