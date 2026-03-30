import type Braintrust from '@braintrust/api';
import { withResult } from '@viteval/internal';
import type {
  AddEvalResultParams,
  CompleteEvalRunParams,
  CreateEvalRunParams,
  EvalProvider,
  GetEvalRunParams,
  ListEvalRunsParams,
  StoredEvalResult,
  StoredEvalRun,
} from '@viteval/core';

/**
 * Create eval run operations backed by Braintrust experiments.
 *
 * @param getClient - Factory returning the Braintrust API client.
 * @param getProjectId - Factory returning the resolved project ID.
 * @returns An EvalProvider implementation.
 */
export function createBraintrustEvalOps(
  getClient: () => Promise<Braintrust>,
  getProjectId: () => string
): EvalProvider {
  return {
    create: (params) =>
      withResult(async () => {
        const client = await getClient();
        const experiment = await client.experiments.create({
          project_id: getProjectId(),
          name: params.name,
          dataset_id: params.datasetId,
          metadata: {
            ...params.metadata,
            _viteval_config: params.config,
            _viteval_tags: params.tags,
          },
        });

        return mapExperiment(experiment, params);
      }),

    get: (params) =>
      withResult(async () => {
        const client = await getClient();
        const experiment = await client.experiments.retrieve(params.id);

        const run = mapExperiment(experiment);

        if (params.includeResults) {
          const response = await client.experiments.fetch(params.id);
          run.results = response.events.map((event) =>
            mapExperimentEvent(event, params.id)
          );
        }

        return run;
      }),

    list: (params) =>
      withResult(async () => {
        const client = await getClient();
        const page = await client.experiments.list({
          project_id: getProjectId(),
          limit: params?.limit,
        });

        const experiments: Array<Braintrust.Experiment> = [];
        let skipped = 0;
        for await (const e of page) {
          // Apply local filters that Braintrust doesn't support server-side
          if (params?.datasetId && e.dataset_id !== params.datasetId) continue;
          if (params?.status) {
            const meta = e.metadata ?? {};
            const status = (meta._viteval_status as string) ?? 'running';
            if (status !== params.status) continue;
          }
          if (params?.tags?.length) {
            const meta = e.metadata ?? {};
            const tags = (meta._viteval_tags as string[]) ?? [];
            if (!params.tags.some((t) => tags.includes(t))) continue;
          }

          if (params?.offset && skipped < params.offset) {
            skipped++;
            continue;
          }
          experiments.push(e);
          if (params?.limit && experiments.length >= params.limit) break;
        }

        return experiments.map((e) => mapExperiment(e));
      }),

    addResult: (params) =>
      withResult(async () => {
        const client = await getClient();
        const response = await client.experiments.insert(params.evalRunId, {
          events: [mapResultToEvent(params)],
        });

        return {
          id: response.row_ids[0]!,
          evalRunId: params.evalRunId,
          input: params.input,
          expected: params.expected,
          output: params.output,
          scores: params.scores,
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          sumScore: params.sumScore,
          passed: params.passed,
          duration: params.duration,
          metadata: params.metadata ?? {},
        };
      }),

    addResults: (paramsList) =>
      withResult(async () => {
        if (paramsList.length === 0) return [];

        const evalRunId = paramsList[0]!.evalRunId;
        if (paramsList.some((p) => p.evalRunId !== evalRunId)) {
          throw new Error('All results must belong to the same eval run');
        }

        const client = await getClient();

        const response = await client.experiments.insert(evalRunId, {
          events: paramsList.map(mapResultToEvent),
        });

        return paramsList.map((params, i) => ({
          id: response.row_ids[i]!,
          evalRunId: params.evalRunId,
          input: params.input,
          expected: params.expected,
          output: params.output,
          scores: params.scores,
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          sumScore: params.sumScore,
          passed: params.passed,
          duration: params.duration,
          metadata: params.metadata ?? {},
        }));
      }),

    complete: (params) =>
      withResult(async () => {
        const client = await getClient();
        // Braintrust has no explicit complete — store summary in metadata
        const experiment = await client.experiments.update(params.id, {
          metadata: {
            _viteval_summary: params.summary,
            _viteval_status: params.status ?? 'completed',
          },
        });

        return mapExperiment(experiment, undefined, params);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapResultToEvent(
  params: AddEvalResultParams
): Braintrust.InsertExperimentEventReplace {
  return {
    input: params.input,
    output: params.output,
    expected: params.expected,
    scores: Object.fromEntries(
      params.scores.map((s) => [s.name, s.score])
    ),
    metadata: {
      ...params.metadata,
      _viteval_mean_score: params.meanScore,
      _viteval_median_score: params.medianScore,
      _viteval_sum_score: params.sumScore,
      _viteval_passed: params.passed,
    },
    metrics: params.duration
      ? {
          start: 0,
          end: params.duration / 1000,
        }
      : undefined,
  };
}

function mapExperiment(
  experiment: Braintrust.Experiment,
  createParams?: CreateEvalRunParams,
  completeParams?: CompleteEvalRunParams
): StoredEvalRun {
  const metadata = experiment.metadata ?? {};
  const status =
    (completeParams?.status as StoredEvalRun['status']) ??
    (metadata._viteval_status as StoredEvalRun['status']) ??
    'running';

  return {
    id: experiment.id,
    name: experiment.name,
    datasetId: experiment.dataset_id ?? undefined,
    status,
    config: (createParams?.config ??
      metadata._viteval_config ?? {
        aggregation: 'mean',
        threshold: 0.5,
        scorerNames: [],
      }) as StoredEvalRun['config'],
    summary: (completeParams?.summary ??
      metadata._viteval_summary) as StoredEvalRun['summary'],
    tags: (createParams?.tags ??
      (metadata._viteval_tags as string[]) ??
      []) as string[],
    metadata: Object.fromEntries(
      Object.entries(metadata).filter(([k]) => !k.startsWith('_viteval_'))
    ),
    startedAt: experiment.created ? new Date(experiment.created) : new Date(),
    completedAt: completeParams ? new Date() : undefined,
  };
}

function mapExperimentEvent(
  event: Braintrust.ExperimentEvent,
  evalRunId: string
): StoredEvalResult {
  const metadata = (event.metadata ?? {}) as Record<string, unknown>;
  const scores = event.scores ?? {};

  return {
    id: event.id,
    evalRunId,
    input: event.input,
    expected: event.expected,
    output: event.output,
    scores: Object.entries(scores)
      .filter((entry): entry is [string, number] => entry[1] != null)
      .map(([name, score]) => ({
        name,
        score,
      })),
    meanScore: (metadata._viteval_mean_score as number) ?? 0,
    medianScore: (metadata._viteval_median_score as number) ?? 0,
    sumScore: (metadata._viteval_sum_score as number) ?? 0,
    passed: (metadata._viteval_passed as boolean) ?? false,
    duration: event.metrics?.end
      ? event.metrics.end * 1000
      : undefined,
    metadata: Object.fromEntries(
      Object.entries(metadata).filter(([k]) => !k.startsWith('_viteval_'))
    ),
  };
}
