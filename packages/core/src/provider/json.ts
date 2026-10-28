import { createProvider } from './create';
import { createJsonDatasets } from './json-datasets';
import { createJsonEvals } from './json-evals';
import { createJsonStore } from './json-store';
import { createJsonTags } from './json-tags';
import type { Provider } from './types';

/**
 * Create the local JSON provider used by Viteval's default storage.
 * @param options - Project root containing the .viteval directory.
 * @returns Dataset, evaluation, and tag operations backed by atomic JSON files.
 * @example
 * const provider = createJsonProvider({ root: process.cwd() });
 * export default defineConfig({ providers: [provider] });
 */
export function createJsonProvider(options: { root?: string } = {}): Provider {
  const store = createJsonStore(options.root ?? process.cwd());
  return createProvider({
    name: 'json',
    datasets: createJsonDatasets(store),
    evals: createJsonEvals(store),
    tags: createJsonTags(store),
  });
}
