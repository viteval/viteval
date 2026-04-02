import { createFs } from './fs';
import { createDatasetsResource } from './resources/datasets';
import { createResultsResource } from './resources/results';
import { createSchemasResource } from './resources/schemas';
import { createSuitesResource } from './resources/suites';
import type { CreateVitevalParams, Viteval } from './types';

/**
 * Create a Viteval SDK client for reading evaluation data.
 *
 * @param params - Optional configuration.
 * @returns A Viteval SDK client.
 *
 * @example
 * ```ts
 * const viteval = createViteval({ root: '/path/to/project' });
 *
 * const { data, total } = await viteval.results.list({ page: 1, limit: 20 });
 * const { data } = await viteval.results.get({ id: 'brave-orange-dolphin' });
 * ```
 */
export function createViteval(params?: CreateVitevalParams): Viteval {
  const root =
    params?.root || process.env.VITEVAL_ROOT_PATH || process.cwd();
  const fsHelper = createFs(root);

  return {
    datasets: createDatasetsResource(fsHelper),
    results: createResultsResource(fsHelper),
    schemas: createSchemasResource(fsHelper),
    suites: createSuitesResource(fsHelper),
  };
}
