import type { EmbeddingModel, LanguageModel } from 'ai';
import type { DatasetProvider, EvalProvider, Provider } from '#/provider/types';

declare global {
  // Biome-ignore lint: used by model internals
  var __viteval_model: LanguageModel | undefined;
  // Biome-ignore lint: used by model internals
  var __viteval_embeddingModel: EmbeddingModel | undefined;
  // Biome-ignore lint: used by provider internals
  var __viteval_provider: Provider | undefined;
  // Biome-ignore lint: used by provider internals
  var __viteval_datasetProvider: DatasetProvider | undefined;
  // Biome-ignore lint: used by provider internals
  var __viteval_evalProvider: EvalProvider | undefined;
  // Biome-ignore lint: used by provider internals
  var __viteval_providerInitialized: boolean | undefined;
  // Biome-ignore lint: used by provider internals
  var __viteval_providerInitPromise: Promise<void> | undefined;
}
