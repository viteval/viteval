import type { VitevalConfig } from './types';

export type {
  VitevalConfig,
  EvalOptions,
  ModelId,
  ModelProvider,
} from './types';

/**
 * Define a Viteval project. Clients initialize lazily inside each worker.
 * @param config - Evaluation defaults, model backends, and storage integrations.
 * @returns The project configuration without registering or initializing clients.
 * @example export default defineConfig({ eval: { results: ['json'] } });
 */
export function defineConfig(config: VitevalConfig): VitevalConfig {
  const marked = { ...config, __viteval: true };
  return marked;
}
