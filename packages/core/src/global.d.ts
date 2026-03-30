import type { EmbeddingModel, LanguageModel } from 'ai';

declare global {
  // Biome-ignore lint: used by provider internals
  var __model: LanguageModel | undefined;
  // Biome-ignore lint: used by provider internals
  var __embeddingModel: EmbeddingModel | undefined;
}
