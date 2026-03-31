---
'@viteval/core': major
'viteval': major
---

Convert all scorers to configurable factory functions

- **BREAKING**: All scorers are now factory functions that must be called: `scorers.exactMatch()` instead of `scorers.exactMatch`
- Deterministic scorers accept typed options: `exactMatch({ caseSensitive, trim })`, `levenshtein({ threshold })`, `numericDiff({ tolerance })`, `jsonDiff({ threshold })`, `listContains({ threshold })`
- LLM scorers accept per-scorer model overrides: `scorers.answerCorrectness({ model: openai('gpt-4o') })`
- `createJudgeScorer` now returns a factory `(options?) => Scorer` instead of a bare `Scorer`
- Update all examples to use factory call syntax

Closes #36
