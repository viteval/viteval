import type { EmbeddingModel, LanguageModel } from 'ai';

declare global {
  // biome-ignore lint: used by provider internals
  var __model: LanguageModel | undefined;
  // biome-ignore lint: used by provider internals
  var __embeddingModel: EmbeddingModel | undefined;
}
