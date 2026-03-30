# Provider: {NAME}

> **Status:** not-started | in-progress | complete
> **Website:** {URL}
> **npm:** `{package-name}`
> **Priority:** high | medium | low

## Overview

{1-2 sentence description of what the platform does.}

## TypeScript SDK

- **Package:** `{npm-package}`
- **Auth:** {how auth works — API key, key pair, OAuth, etc.}
- **Base URL:** `{api-base-url}`

## Concepts

| Viteval Concept | {Provider} Equivalent | Notes |
| --------------- | --------------------- | ----- |
| Dataset         |                       |       |
| DatasetItem     |                       |       |
| EvalRun         |                       |       |
| EvalResult      |                       |       |
| Score           |                       |       |

## DatasetProvider Mapping

| Method             | Endpoint / SDK Method | Supported | Notes |
| ------------------ | --------------------- | --------- | ----- |
| `create()`         |                       |           |       |
| `get()`            |                       |           |       |
| `list()`           |                       |           |       |
| `update()`         |                       |           |       |
| `delete()`         |                       |           |       |
| `getItems()`       |                       |           |       |
| `addItems()`       |                       |           |       |

## EvalProvider Mapping

| Method             | Endpoint / SDK Method | Supported | Notes |
| ------------------ | --------------------- | --------- | ----- |
| `create()`         |                       |           |       |
| `get()`            |                       |           |       |
| `list()`           |                       |           |       |
| `addResult()`      |                       |           |       |
| `complete()`       |                       |           |       |

## Gaps

### Things they support that we don't

-

### Things we support that they don't

-

## Integration Notes

{Any architectural mismatches, multi-call requirements, pagination differences, etc.}

## Sources

- [{Doc Name}]({url})
- [{API Reference}]({url})
- [{npm package}]({url})
- [{GitHub repo}]({url})

## Verdict

{Overall assessment: how well does our interface fit? What would be hardest to implement?}
