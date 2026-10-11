import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const paginationSchema = z.object({
  limit: z.number(),
  page: z.number(),
});

/**
 * Loads dashboard summaries using the configured project root.
 * @returns Recent results, chart history, and recent datasets with totals.
 * @example await getDashboard();
 */
export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { createViteval } = await import('@/sdk');
    const viteval = createViteval();
    const [resultsResponse, chartResponse, datasetsResponse] =
      await Promise.all([
        viteval.results.list({ limit: 5, page: 1 }),
        viteval.results.list({ limit: 200, page: 1 }),
        viteval.datasets.list({ limit: 5, page: 1, sort: 'recent' }),
      ]);
    return { resultsResponse, chartResponse, datasetsResponse };
  }
);

/**
 * Loads a dataset listing without exposing the filesystem SDK to the browser.
 * @param data - Validated page and limit from route search parameters.
 * @returns Paginated dataset summaries and storage warnings.
 * @example await getDatasets({ data: { page: 1, limit: 20 } });
 */
export const getDatasets = createServerFn({ method: 'GET' })
  .validator(paginationSchema)
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    return createViteval().datasets.list(data);
  });

/**
 * Loads a dataset by its decoded route ID.
 * @param data - The dataset ID, decoded once by Router.
 * @returns The dataset, a missing-data response, or a storage error.
 * @example await getDataset({ data: { id: 'questions' } });
 */
export const getDataset = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    const { toSerializable } = await import('./serializable');
    return toSerializable(await createViteval().datasets.get(data));
  });

/**
 * Loads the paginated result listing.
 * @param data - Validated page and limit from route search parameters.
 * @returns Run summaries, totals, and storage warnings.
 * @example await getResults({ data: { page: 1, limit: 20 } });
 */
export const getResults = createServerFn({ method: 'GET' })
  .validator(paginationSchema)
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    return createViteval().results.list(data);
  });

/**
 * Loads a result for initial rendering; live updates use the public HTTP API.
 * @param data - The run ID, decoded once by Router.
 * @returns The run, a missing-data response, or a storage error.
 * @example await getResult({ data: { id: 'run-id' } });
 */
export const getResult = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    const { toSerializable } = await import('./serializable');
    return toSerializable(await createViteval().results.get(data));
  });

/**
 * Loads project-qualified evaluation suites.
 * @param data - Validated page and limit from route search parameters.
 * @returns Paginated evaluation summaries.
 * @example await getSuites({ data: { page: 1, limit: 20 } });
 */
export const getSuites = createServerFn({ method: 'GET' })
  .validator(paginationSchema)
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    return createViteval().suites.list(data);
  });

/**
 * Loads a suite, its runs, and the latest source using the server SDK.
 * @param data - Suite slug and validated pagination for its runs.
 * @returns The suite detail, or null when its slug is missing.
 * @example await getSuiteDetail({ data: { slug: 'eval', page: 1, limit: 20 } });
 */
export const getSuiteDetail = createServerFn({ method: 'GET' })
  .validator(paginationSchema.extend({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { createViteval } = await import('@/sdk');
    const viteval = createViteval();
    const response = await viteval.suites.get({ slug: data.slug });
    if (!response.data) {
      return null;
    }
    const suite = response.data;
    const [results, schema] = await Promise.all([
      viteval.results.list({
        limit: data.limit,
        page: data.page,
        suite: suite.name,
      }),
      suite.filepath ? viteval.schemas.get({ id: suite.filepath }) : null,
    ]);
    return {
      suite,
      suiteResults: results.data,
      latestSource: schema?.data?.content ?? null,
    };
  });
