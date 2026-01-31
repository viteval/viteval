# Overview Template

Copy-paste template for creating overview/reference documentation.

**Location:** `docs/concepts/` or `docs/reference/`

---

```markdown
# Topic Name

Brief one-line description of the topic.

## Overview

High-level explanation of what this is and why it matters.

## Architecture

\`\`\`mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#6c7086',
    'lineColor': '#89b4fa',
    'secondaryColor': '#45475a',
    'tertiaryColor': '#1e1e2e',
    'background': '#1e1e2e',
    'mainBkg': '#313244',
    'clusterBkg': '#1e1e2e',
    'clusterBorder': '#45475a'
  },
  'flowchart': { 'curve': 'basis', 'padding': 15 }
}}%%
flowchart LR
    A(["Component A"]) --> B(["Component B"])
    B --> C(["Component C"])

    classDef default fill:#313244,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
\`\`\`

## Key Concepts

### Concept 1

Explanation with minimal example.

### Concept 2

Explanation with minimal example.

## Usage

### Basic Usage

Minimal code example showing common use case:

\`\`\`ts
// Focused example
\`\`\`

### Advanced Usage

More complex example if needed.

## Configuration

| Option    | Type      | Default     | Description      |
| --------- | --------- | ----------- | ---------------- |
| `option1` | `string`  | `"default"` | What it does     |
| `option2` | `boolean` | `false`     | What it controls |

## References

- [Related Guide](../guides/related-guide.md)
- [Related Concept](./related.md)
- [External Docs](https://example.com)
```

---

## Rules

- Explain "what" and "why" briefly
- Show "how" with focused examples
- Include architecture diagram using [diagram standards](./diagrams.md)
- Link to guides for step-by-step instructions

## References

- [Writing Standards](./writing.md)
- [Diagram Standards](./diagrams.md)
