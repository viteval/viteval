---
'@viteval/core': major
'viteval': major
---

Replace OpenAI SDK with Vercel AI SDK for provider-agnostic model support

- **BREAKING**: Remove `openai` dependency, add `ai` (Vercel AI SDK) as the provider abstraction
- **BREAKING**: `VitevalProviderConfig` now accepts `model` (LanguageModel) and optional `embeddingModel` (EmbeddingModel) instead of `openai` config
- **BREAKING**: Remove automatic `OPENAI_API_KEY` env var detection — users must explicitly configure a provider
- Replace `requireClient()` / `getClient()` with `requireModel()` / `requireEmbeddingModel()`
- Rewrite `runJudge` to use `generateObject()` from AI SDK instead of OpenAI function calling
- Rewrite `getEmbedding` to use `embed()` from AI SDK instead of OpenAI embeddings API
- Convert `moderation` scorer from OpenAI moderation API to LLM judge (now provider-agnostic)
- Export `initializeProvider()` from public API for setup file usage
- Users can now use any AI SDK-compatible provider: OpenAI, Anthropic, Google, Mistral, etc.
