---
'@viteval/core': minor
'viteval': minor
---

Add `sampleItems` utility for generating N dataset items from a single factory function

- `sampleItems({ item, count })` returns a `DataGenerator` compatible with `defineDataset()` and `evaluate()`
- Items are generated sequentially to respect rate limits on LLM calls
- Validates that `count >= 1`

Closes #38
