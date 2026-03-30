import type { ModelConfig } from './types';

/**
 * Initialize the model configuration with AI SDK model instances.
 *
 * @param config - The model config (shorthand LanguageModel or full config).
 */
export function initializeModel(config: ModelConfig) {
  if (globalThis.__model) {
    return;
  }

  if (isFullConfig(config)) {
    globalThis.__model = config.language;
    globalThis.__embeddingModel = config.embedding;
  } else {
    globalThis.__model = config;
  }
}

/*
|------------------
| Internals
|------------------
*/

function isFullConfig(
  config: ModelConfig
): config is { language: import('ai').LanguageModel; embedding?: import('ai').EmbeddingModel } {
  return typeof config === 'object' && 'language' in config;
}
