import type { ModelConfig, ModelConfigFull } from './types';

/**
 * Initialize the model configuration with AI SDK model instances.
 *
 * @param config - The model config (shorthand LanguageModel or full config).
 */
export function initializeModel(config: ModelConfig) {
  if (globalThis.__viteval_model) {
    // Backfill embedding model if a full config is provided after a shorthand init
    if (isFullConfig(config) && !globalThis.__viteval_embeddingModel && config.embedding) {
      globalThis.__viteval_embeddingModel = config.embedding;
    }
    return;
  }

  if (isFullConfig(config)) {
    globalThis.__viteval_model = config.language;
    globalThis.__viteval_embeddingModel = config.embedding;
  } else {
    globalThis.__viteval_model = config;
  }
}

/*
|------------------
| Internals
|------------------
*/

function isFullConfig(config: ModelConfig): config is ModelConfigFull {
  return typeof config === 'object' && 'language' in config;
}
