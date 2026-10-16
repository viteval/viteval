---
'@viteval/core': minor
'viteval': minor
---

Add `sampleItems` utility for generating N dataset items from a single factory function

- `sampleItems({ item, count })` returns a `Result<DataGenerator>` so invalid counts are represented without throwing
- Items are generated sequentially to respect rate limits on LLM calls
- Validates that `count >= 1`

Closes #38
