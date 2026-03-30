---
'@viteval/core': major
'@viteval/internal': major
---

Replace autoevals dependency with custom scorer implementations

- Remove `autoevals` third-party dependency
- Implement all 20 scorers in-house (deterministic, embedding, LLM-based)
- Add shared `runJudge` helper for LLM-as-judge scoring via OpenAI function calling
- Add shared `getEmbedding` helper for OpenAI embeddings API
- Add `isNumber` and `clamp` utilities to `@viteval/internal`
- Simplify provider initialization by removing autoevals init workaround
