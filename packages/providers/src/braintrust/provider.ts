import type Braintrust from '@braintrust/api';
import { withResult } from '@viteval/internal';
import type { Provider } from '@viteval/core';
import { createBraintrustClient } from './client';
import { createBraintrustDatasetOps } from './datasets';
import { createBraintrustEvalOps } from './evals';
import type { BraintrustProviderOptions } from './types';

/**
 * Create a Braintrust provider.
 *
 * Connects to Braintrust's platform for storing datasets and experiment
 * results. Requires a project name and API key.
 *
 * @param options - Braintrust configuration options.
 * @returns A Provider backed by the Braintrust API.
 *
 * @example
 * ```ts
 * import { braintrust } from '@viteval/providers/braintrust';
 *
 * defineConfig({
 *   provider: braintrust({
 *     project: 'my-project',
 *     apiKey: process.env.BRAINTRUST_API_KEY,
 *   }),
 * });
 * ```
 */
export function braintrust(options: BraintrustProviderOptions): Provider {
  const getClient = createBraintrustClient(options);
  let projectId: string | undefined;

  const getProjectId = (): string => {
    if (!projectId) {
      throw new Error(
        'Braintrust provider not initialized. Call initialize() first.'
      );
    }
    return projectId;
  };

  return {
    close: () =>
      withResult(async () => {
        // No persistent connections to close — HTTP client is stateless
      }),
    datasets: createBraintrustDatasetOps(getClient, getProjectId),
    evals: createBraintrustEvalOps(getClient, getProjectId),

    initialize: () =>
      withResult(async () => {
        const client = await getClient();
        projectId = await resolveProjectId(client, options.project);
      }),

    name: 'braintrust',
  };
}

/*
|------------------
| Internals
|------------------
*/

/**
 * Resolve a project name to an ID, creating the project if it doesn't exist.
 */
async function resolveProjectId(
  client: Braintrust,
  projectName: string
): Promise<string> {
  // Try to find existing project by name
  for await (const project of client.projects.list({
    project_name: projectName,
  })) {
    if (project.name === projectName) {
      return project.id;
    }
  }

  // Create if not found
  const project = await client.projects.create({ name: projectName });
  return project.id;
}
