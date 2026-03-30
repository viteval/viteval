import type { EmbeddingModel, LanguageModel } from 'ai';

declare global {
  var __model: LanguageModel | undefined;
  var __embeddingModel: EmbeddingModel | undefined;
}
