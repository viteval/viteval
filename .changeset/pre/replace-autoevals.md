---
'@viteval/core': major
'@viteval/internal': major
---

Replace autoevals dependency with custom scorer implementations

- Remove `autoevals` third-party dependency
- Implement all 20 scorers in-house (deterministic, embedding, LLM-based)
- Add Result-returning `runJudge` and `getEmbedding` helpers for AI SDK models
- Add `isNumber` and `clamp` utilities to `@viteval/internal`
- Simplify provider initialization by removing autoevals init workaround
