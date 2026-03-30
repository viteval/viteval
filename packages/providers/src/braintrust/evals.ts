import type Braintrust from '@braintrust/api';
import { withResult } from '@viteval/internal';
import type {
  AddEvalResultParams,
  CompleteEvalRunParams,
  CreateEvalRunParams,
  EvalProvider,
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
    addResult: (params) =>
      withResult(async () => {
        const client = await getClient();
        const response = await client.experiments.insert(params.evalRunId, {
          events: [mapResultToEvent(params)],
        });

        return {
          duration: params.duration,
          evalRunId: params.evalRunId,
          expected: params.expected,
          id: response.row_ids[0]!,
          input: params.input,
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          metadata: params.metadata ?? {},
          output: params.output,
          passed: params.passed,
          scores: params.scores,
          sumScore: params.sumScore,
        };
      }),

    addResults: (paramsList) =>
      withResult(async () => {
        if (paramsList.length === 0) {return [];}

        const {evalRunId} = paramsList[0]!;
        if (paramsList.some((p) => p.evalRunId !== evalRunId)) {
          throw new Error('All results must belong to the same eval run');
        }

        const client = await getClient();

        const response = await client.experiments.insert(evalRunId, {
          events: paramsList.map(mapResultToEvent),
        });

        return paramsList.map((params, i) => ({
          duration: params.duration,
          evalRunId: params.evalRunId,
          expected: params.expected,
          id: response.row_ids[i]!,
          input: params.input,
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          metadata: params.metadata ?? {},
          output: params.output,
          passed: params.passed,
          scores: params.scores,
          sumScore: params.sumScore,
        }));
      }),

    complete: (params) =>
      withResult(async () => {
        const client = await getClient();
        // Braintrust has no explicit complete — store summary in metadata
        const experiment = await client.experiments.update(params.id, {
          metadata: {
            _viteval_status: params.status ?? 'completed',
            _viteval_summary: params.summary,
          },
        });

        return mapExperiment(experiment, undefined, params);
      }),

    create: (params) =>
      withResult(async () => {
        const client = await getClient();
        const experiment = await client.experiments.create({
          dataset_id: params.datasetId,
          metadata: {
            ...params.metadata,
            _viteval_config: params.config,
            _viteval_tags: params.tags,
          },
          name: params.name,
          project_id: getProjectId(),
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
          limit: params?.limit,
          project_id: getProjectId(),
        });

        const experiments: (Braintrust.Experiment)[] = [];
        let skipped = 0;
        for await (const e of page) {
          // Apply local filters that Braintrust doesn't support server-side
          if (params?.datasetId && e.dataset_id !== params.datasetId) {continue;}
          if (params?.status) {
            const meta = e.metadata ?? {};
            const status = (meta._viteval_status as string) ?? 'running';
            if (status !== params.status) {continue;}
          }
          if (params?.tags?.length) {
            const meta = e.metadata ?? {};
            const tags = (meta._viteval_tags as string[]) ?? [];
            if (!params.tags.some((t) => tags.includes(t))) {continue;}
          }

          if (params?.offset && skipped < params.offset) {
            skipped++;
            continue;
          }
          experiments.push(e);
          if (params?.limit && experiments.length >= params.limit) {break;}
        }

        return experiments.map((e) => mapExperiment(e));
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
    expected: params.expected,
    input: params.input,
    metadata: {
      ...params.metadata,
      _viteval_mean_score: params.meanScore,
      _viteval_median_score: params.medianScore,
      _viteval_passed: params.passed,
      _viteval_sum_score: params.sumScore,
    },
    metrics: params.duration
      ? {
          end: params.duration / 1000,
          start: 0,
        }
      : undefined,
    output: params.output,
    scores: Object.fromEntries(
      params.scores.map((s) => [s.name, s.score])
    ),
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
    completedAt: completeParams ? new Date() : undefined,
    config: (createParams?.config ??
      metadata._viteval_config ?? {
        aggregation: 'mean',
        scorerNames: [],
        threshold: 0.5,
      }) as StoredEvalRun['config'],
    datasetId: experiment.dataset_id ?? undefined,
    id: experiment.id,
    metadata: Object.fromEntries(
      Object.entries(metadata).filter(([k]) => !k.startsWith('_viteval_'))
    ),
    name: experiment.name,
    startedAt: experiment.created ? new Date(experiment.created) : new Date(),
    status,
    summary: (completeParams?.summary ??
      metadata._viteval_summary) as StoredEvalRun['summary'],
    tags: (createParams?.tags ??
      (metadata._viteval_tags as string[]) ??
      []) as string[],
  };
}

function mapExperimentEvent(
  event: Braintrust.ExperimentEvent,
  evalRunId: string
): StoredEvalResult {
  const metadata = (event.metadata ?? {}) as Record<string, unknown>;
  const scores = event.scores ?? {};

  return {
    duration: event.metrics?.end
      ? event.metrics.end * 1000
      : undefined,
    evalRunId,
    expected: event.expected,
    id: event.id,
    input: event.input,
    meanScore: (metadata._viteval_mean_score as number) ?? 0,
    medianScore: (metadata._viteval_median_score as number) ?? 0,
    metadata: Object.fromEntries(
      Object.entries(metadata).filter(([k]) => !k.startsWith('_viteval_'))
    ),
    output: event.output,
    passed: (metadata._viteval_passed as boolean) ?? false,
    scores: Object.entries(scores)
      .filter((entry): entry is [string, number] => entry[1] !== null && entry[1] !== undefined)
      .map(([name, score]) => ({
        name,
        score,
      })),
    sumScore: (metadata._viteval_sum_score as number) ?? 0,
  };
}
