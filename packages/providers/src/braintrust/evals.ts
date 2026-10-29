import type Braintrust from '@braintrust/api';
import { randomUUID } from 'node:crypto';
import { attemptAsync, err, ok } from 'massaman/control';
import { omitBy } from 'massaman/object';
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
      attemptAsync(async () => {
        const client = await getClient();
        const response = await client.experiments.insert(params.evalRunId, {
          events: [mapResultToEvent(params)],
        });
        if (!response.row_ids[0])
          throw new Error('Braintrust did not return an evaluation result ID');

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

    addResults: (paramsList) => {
      if (paramsList.length === 0) {
        return Promise.resolve(ok([]));
      }

      const { evalRunId } = paramsList[0]!;
      if (paramsList.some((p) => p.evalRunId !== evalRunId)) {
        return Promise.resolve(
          err('All results must belong to the same eval run')
        );
      }

      return attemptAsync(async () => {
        const client = await getClient();

        const response = await client.experiments.insert(evalRunId, {
          events: paramsList.map(mapResultToEvent),
        });
        if (response.row_ids.length !== paramsList.length)
          throw new Error(
            'Braintrust returned an unexpected number of result IDs'
          );

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
      });
    },

    complete: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        const current = await client.experiments.retrieve(params.id);
        const experiment = await client.experiments.update(params.id, {
          metadata: {
            ...current.metadata,
            _viteval_status: params.status ?? 'completed',
            _viteval_summary: params.summary,
            _viteval_completed_at: new Date().toISOString(),
          },
        });

        return mapExperiment(experiment, undefined, params);
      }),

    create: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        const experiment = await client.experiments.create({
          dataset_id: params.datasetId,
          metadata: {
            ...params.metadata,
            _viteval_config: params.config,
            _viteval_name: params.name,
          },
          name: `${params.name}-${randomUUID()}`,
          project_id: getProjectId(),
        });

        return mapExperiment(experiment, params);
      }),

    get: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        const experiment = await client.experiments.retrieve(params.id);

        const run = mapExperiment(experiment);

        if (params.includeResults) {
          const events: Braintrust.ExperimentEvent[] = [];
          let cursor: string | undefined;
          const seen = new Set<string>();
          do {
            const page = await client.experiments.fetchPost(params.id, {
              cursor,
            });
            const ids = new Set(events.map((event) => event.id));
            events.push(...page.events.filter((event) => !ids.has(event.id)));
            cursor = page.cursor ?? undefined;
            if (cursor && seen.has(cursor))
              throw new Error(
                'Braintrust returned a repeated experiment cursor'
              );
            if (cursor) seen.add(cursor);
          } while (cursor);
          run.results = events.map((event) =>
            mapExperimentEvent(event, params.id)
          );
        }

        return run;
      }),

    list: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        const hasLocalFilters = params?.datasetId || params?.status;
        const serverLimit = hasLocalFilters
          ? undefined
          : params?.limit
            ? params?.offset
              ? params.offset + params.limit
              : params.limit
            : undefined;
        const page = await client.experiments.list({
          limit: serverLimit,
          project_id: getProjectId(),
        });

        const experiments: Braintrust.Experiment[] = [];
        let skipped = 0;
        for await (const e of page) {
          // Apply local filters that Braintrust doesn't support server-side
          if (params?.datasetId && e.dataset_id !== params.datasetId) {
            continue;
          }
          if (params?.status) {
            const meta = e.metadata ?? {};
            const status = (meta._viteval_status as string) ?? 'running';
            if (status !== params.status) {
              continue;
            }
          }

          if (params?.offset && skipped < params.offset) {
            skipped++;
            continue;
          }
          experiments.push(e);
          if (params?.limit && experiments.length >= params.limit) {
            break;
          }
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
    metrics:
      params.duration !== undefined
        ? {
            end: params.duration / 1000,
            start: 0,
          }
        : undefined,
    output: params.output,
    scores: Object.fromEntries(params.scores.map((s) => [s.name, s.score])),
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
    completedAt: completeParams
      ? new Date()
      : typeof metadata._viteval_completed_at === 'string'
        ? new Date(metadata._viteval_completed_at)
        : undefined,
    config: (createParams?.config ??
      metadata._viteval_config ?? {
        aggregation: 'mean',
        scorerNames: [],
        threshold: 0.5,
      }) as StoredEvalRun['config'],
    datasetId: experiment.dataset_id ?? undefined,
    id: experiment.id,
    metadata: omitBy(metadata, (_value, key) => key.startsWith('_viteval_')),
    name:
      createParams?.name ??
      (typeof metadata._viteval_name === 'string'
        ? metadata._viteval_name
        : experiment.name),
    startedAt: experiment.created ? new Date(experiment.created) : new Date(),
    status,
    summary: (completeParams?.summary ??
      metadata._viteval_summary) as StoredEvalRun['summary'],
  };
}

function mapExperimentEvent(
  event: Braintrust.ExperimentEvent,
  evalRunId: string
): StoredEvalResult {
  const metadata = (event.metadata ?? {}) as Record<string, unknown>;
  const scores = event.scores ?? {};

  return {
    duration:
      event.metrics?.end !== undefined && event.metrics.end !== null
        ? event.metrics.end * 1000
        : undefined,
    evalRunId,
    expected: event.expected,
    id: event.id,
    input: event.input,
    meanScore: (metadata._viteval_mean_score as number) ?? 0,
    medianScore: (metadata._viteval_median_score as number) ?? 0,
    metadata: omitBy(metadata, (_value, key) => key.startsWith('_viteval_')),
    output: event.output,
    passed: (metadata._viteval_passed as boolean) ?? false,
    scores: Object.entries(scores)
      .filter(
        (entry): entry is [string, number] =>
          entry[1] !== null && entry[1] !== undefined
      )
      .map(([name, score]) => ({
        name,
        score,
      })),
    sumScore: (metadata._viteval_sum_score as number) ?? 0,
  };
}
