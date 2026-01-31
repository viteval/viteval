# Documentation Formatting Standards

Standards for code examples, tables, and markdown formatting.

## Code Examples

### Default: Minimal

Show only the critical parts. Omit imports, boilerplate, and obvious code.

**Good:**

This example is focused on the API.

```ts
const result = evaluate('my-eval', {
  data: testData,
  task: myTask,
  scorers: [exactMatch],
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

const exactMatch = createScorer({
  name: 'exact-match',
  score: ({ output, expected }) => ({
    score: output === expected ? 1.0 : 0.0,
  }),
});

const result = evaluate('my-eval', {
  data: testData,
  task: myTask,
  scorers: [exactMatch],
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

## Tables

Use tables for structured information:

| Item   | Description |
| ------ | ----------- |
| First  | Description |
| Second | Description |

### When to Use Tables

| Use Tables For           | Use Lists For                  |
| ------------------------ | ------------------------------ |
| Structured data          | Simple enumeration             |
| Comparisons              | Ordered steps                  |
| Option/config references | Prerequisites                  |
| Command references       | Bullet points of related items |

## Code Blocks

Always specify language for syntax highlighting:

```ts
const example = 'typescript';
```

```bash
echo "shell commands"
```

```json
{ "key": "value" }
```

### Common Language Tags

| Language   | Tag        |
| ---------- | ---------- |
| TypeScript | `ts`       |
| JavaScript | `js`       |
| Shell      | `bash`     |
| JSON       | `json`     |
| YAML       | `yaml`     |
| Markdown   | `markdown` |
| Mermaid    | `mermaid`  |
| Plain text | `text`     |

## Links

- Use relative links for internal docs: `[Testing](../testing.md)`
- Use full URLs for external: `[Vitest](https://vitest.dev)`

### Link Text Guidelines

| Good                             | Bad                                 |
| -------------------------------- | ----------------------------------- |
| `[Testing Standards](./test.md)` | `[click here](./test.md)`           |
| `[Vitest docs](https://...)`     | `[https://vitest.dev](https://...)` |
| `See [Architecture](./arch.md)`  | `See this [link](./arch.md)`        |

## Alerts

Use [GFM alerts](https://github.com/orgs/community/discussions/16925) for callouts:

```markdown
> [!TIP]
> Helpful advice for better usage.

> [!NOTE]
> Important information the user should know.

> [!WARNING]
> Critical information about potential issues.

> [!IMPORTANT]
> Key information that must not be missed.
```

### When to Use Each

| Alert     | Usage                                  |
| --------- | -------------------------------------- |
| TIP       | Helpful suggestions, best practices    |
| NOTE      | Additional context, clarification      |
| WARNING   | Potential issues, destructive actions  |
| IMPORTANT | Critical information, breaking changes |

## Headings

- Use sentence case: "Getting started" not "Getting Started"
- Keep headings short and descriptive
- Don't skip heading levels (H1 → H3)
- Only one H1 per document (the title)

## References

- [Writing Standards](./writing.md)
- [Diagram Standards](./diagrams.md)
