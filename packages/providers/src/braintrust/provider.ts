import type Braintrust from '@braintrust/api';
import { attemptAsync, isErr, ok } from 'massaman/control';
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
  let datasets: ReturnType<typeof createBraintrustDatasetOps> | undefined;
  let evals: ReturnType<typeof createBraintrustEvalOps> | undefined;

  return {
    close: () =>
      attemptAsync(async () => {
        // No persistent connections to close — HTTP client is stateless
      }),
    get datasets() {
      return datasets;
    },
    get evals() {
      return evals;
    },

    initialize: async () => {
      const clientResult = await getClient();
      if (isErr(clientResult)) {
        return clientResult;
      }

      const client = clientResult.value;
      const projectResult = await attemptAsync(() =>
        resolveProjectId(client, options.project)
      );
      if (isErr(projectResult)) {
        return projectResult;
      }

      const projectId = projectResult.value;
      const getInitializedClient = async () => client;
      const getProjectId = () => projectId;
      datasets = createBraintrustDatasetOps(getInitializedClient, getProjectId);
      evals = createBraintrustEvalOps(getInitializedClient, getProjectId);
      return ok(undefined);
    },

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
