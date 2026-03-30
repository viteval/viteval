import type { EmbeddingModel, LanguageModel } from 'ai';
import type { DatasetProvider, EvalProvider, Provider } from '#/provider/types';

declare global {
  // Biome-ignore lint: used by model internals
  var __model: LanguageModel | undefined;
  // Biome-ignore lint: used by model internals
  var __embeddingModel: EmbeddingModel | undefined;
  // Biome-ignore lint: used by provider internals
  var __provider: Provider | undefined;
  // Biome-ignore lint: used by provider internals
  var __datasetProvider: DatasetProvider | undefined;
  // Biome-ignore lint: used by provider internals
  var __evalProvider: EvalProvider | undefined;
  // Biome-ignore lint: used by provider internals
  var __providerInitialized: boolean | undefined;
}
