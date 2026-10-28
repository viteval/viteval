import { createHash, randomUUID } from 'node:crypto';
import type {
  VoltOpsRestClient,
  AppendEvalRunResultPayload,
} from '@voltagent/sdk';
import { attemptAsync, err } from 'massaman/control';
import type {
  AddEvalResultParams,
  EvalProvider,
  Provider,
  StoredEvalRun,
  StoredEvalResult,
} from '@viteval/core';
import { serializeJson } from '@viteval/internal';
import { jsonValue } from '#/remote-record';
import { createVoltOpsDatasets } from './datasets';

export interface VoltOpsProviderOptions {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  /** SDK request timeout in milliseconds. */
  timeout?: number;
  /** Optional hosted dataset whose latest version is bound to new runs. */
  datasetId?: string;
  /** Bind runs to an existing hosted experiment instead of creating one per suite run. */
  experimentId?: string;
  triggerSource?: string;
}

/** Create a hosted VoltOps provider using the official evaluation SDK.
 * @param options - Hosted project credentials, API URL, and optional experiment/dataset binding.
 * @returns Lazy dataset and evaluation operations.
 * @example defineConfig({ providers: [voltops({ publicKey: 'pk', secretKey: 'sk' })] });
 */
export function voltops(options: VoltOpsProviderOptions): Provider {
  let client: VoltOpsRestClient | undefined;
  let datasets: Provider['datasets'];
  let evals: Provider['evals'];
  return {
    name: 'voltops',
    get datasets() {
      return datasets;
    },
    get evals() {
      return evals;
    },
    initialize: () =>
      attemptAsync(async () => {
        if (client) return;
        if (!options.publicKey?.trim() || !options.secretKey?.trim())
          throw new Error('VoltOps requires publicKey and secretKey');
        const imported = await attemptAsync(() => import('@voltagent/sdk'));
        if (!imported.ok)
          throw new Error(
            'Install @voltagent/sdk to use the hosted VoltOps provider',
            { cause: imported.error }
          );
        client = new imported.value.VoltOpsRestClient(options);
        datasets = createVoltOpsDatasets(client);
        evals = createVoltOpsEvals({ client, options });
      }),
    close: () =>
      attemptAsync(async () => {
        client = undefined;
        datasets = undefined;
        evals = undefined;
      }),
  };
}

function createVoltOpsEvals({
  client,
  options,
}: {
  client: VoltOpsRestClient;
  options: VoltOpsProviderOptions;
}): EvalProvider {
  let runs = new Map<string, StoredEvalRun>();
  let scorers = new Map<string, ReadonlyMap<string, string>>();
  let versions = new Map<string, string | undefined>();
  function current(id: string) {
    const run = runs.get(id);
    if (!run)
      throw new Error(
        `VoltOps run not created by this provider session: ${id}. Historical runs are available in the VoltOps console; the SDK does not expose run retrieval.`
      );
    return run;
  }
  function resultPayload(params: AddEvalResultParams): {
    stored: StoredEvalResult;
    payload: AppendEvalRunResultPayload;
  } {
    const run = current(params.evalRunId);
    if (run.status !== 'running')
      throw new Error(`Run is already finalized: ${run.id}`);
    jsonValue(params);
    const id = randomUUID();
    const stored = { ...params, id, metadata: params.metadata ?? {} };
    const registry = scorers.get(run.id);
    return {
      stored,
      payload: {
        id,
        datasetId: run.datasetId,
        datasetVersionId: versions.get(run.id),
        datasetItemId:
          typeof params.metadata?.datasetItemId === 'string'
            ? params.metadata.datasetItemId
            : undefined,
        datasetItemHash: createHash('sha256')
          .update(
            serializeJson({
              input: params.input,
              expected: params.expected,
            })
          )
          .digest('hex'),
        datasetItemLabel:
          typeof params.metadata?.name === 'string'
            ? params.metadata.name
            : undefined,
        input: jsonValue(params.input),
        expected: jsonValue(params.expected),
        output: jsonValue(params.output),
        status: resultStatus(params),
        threshold: run.config.threshold,
        thresholdPassed: isSkipped(params) ? null : params.passed,
        durationMs: params.duration,
        metadata: {
          ...params.metadata,
          viteval_result: serializeJson(stored),
          aggregation: run.config.aggregation,
        },
        scores: params.scores.map((score) => {
          const scorerId = registry?.get(score.name);
          if (!scorerId)
            throw new Error(
              `Scorer was not registered for this VoltOps run: ${score.name}`
            );
          return { scorerId, score: score.score, metadata: score.metadata };
        }),
      },
    };
  }
  async function append(params: AddEvalResultParams[]) {
    if (!params.length) return [];
    if (params.some((item) => item.evalRunId !== params[0].evalRunId))
      throw new Error('All results must belong to the same eval run');
    const normalized = params.map(resultPayload);
    await client.appendEvalResults(params[0].evalRunId, {
      results: normalized.map((result) => result.payload),
    });
    const run = current(params[0].evalRunId);
    const stored = normalized.map((result) => result.stored);
    runs = new Map([
      ...runs,
      [run.id, { ...run, results: [...(run.results ?? []), ...stored] }],
    ]);
    return stored;
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        jsonValue(params);
        const datasetId = params.datasetId ?? options.datasetId;
        const datasetVersionId = datasetId
          ? await client.getLatestDatasetVersionId(datasetId)
          : undefined;
        if (datasetId && !datasetVersionId)
          throw new Error(`VoltOps dataset has no version: ${datasetId}`);
        const experimentId =
          options.experimentId ??
          (
            await client.createExperiment({
              name: `${params.name}-${randomUUID()}`,
              targetType: 'none',
              datasetId,
              datasetVersionId,
              config: { ...params.config },
              metadata: { ...params.metadata, viteval_name: params.name },
            })
          ).id;
        const registry = new Map<string, string>();
        for (const name of params.config.scorerNames) {
          const scorer = await client.createEvalScorer({
            id: `viteval-${randomUUID()}`,
            name,
            metadata: { source: 'viteval' },
          });
          registry.set(name, scorer.id);
        }
        const response = await client.createEvalRun({
          experimentId,
          datasetVersionId: datasetVersionId ?? undefined,
          autoQueue: false,
          triggerSource: options.triggerSource ?? 'viteval',
        });
        const run: StoredEvalRun = {
          id: response.id,
          name: params.name,
          datasetId,
          status: 'running',
          config: params.config,
          metadata: { ...params.metadata, experimentId, datasetVersionId },
          startedAt: new Date(response.startedAt ?? response.createdAt),
        };
        runs = new Map([...runs, [run.id, run]]);
        scorers = new Map([...scorers, [run.id, registry]]);
        versions = new Map([
          ...versions,
          [run.id, datasetVersionId ?? undefined],
        ]);
        return run;
      }),
    addResult: (params) =>
      attemptAsync(async () => (await append([params]))[0]),
    addResults: (params) => attemptAsync(() => append(params)),
    complete: (params) =>
      attemptAsync(async () => {
        const run = current(params.id);
        if (run.status !== 'running')
          throw new Error(`Run is already finalized: ${run.id}`);
        jsonValue(params.summary);
        const status = params.status ?? 'completed';
        const completed: StoredEvalRun = {
          ...run,
          status,
          summary: params.summary,
          completedAt: new Date(),
        };
        const { results: _results, ...snapshot } = completed;
        await client.completeEvalRun(run.id, {
          status:
            status === 'failed' || !params.summary.passed
              ? 'failed'
              : 'succeeded',
          summary: {
            itemCount: params.summary.totalCount,
            successCount: params.summary.passedCount,
            failureCount: params.summary.failedCount,
            meanScore: params.summary.meanScore,
            medianScore: params.summary.medianScore,
            sumScore: params.summary.sumScore,
            passRate: params.summary.totalCount
              ? params.summary.passedCount / params.summary.totalCount
              : 0,
            metadata: { viteval_run: serializeJson(snapshot) },
          },
        });
        runs = new Map([...runs, [run.id, completed]]);
        return completed;
      }),
    get: (params) =>
      attemptAsync(async () => {
        const run = current(params.id);
        return {
          ...run,
          results: params.includeResults ? run.results : undefined,
        };
      }),
    list: () =>
      Promise.resolve(
        err(
          'The VoltOps SDK does not expose historical run listing; inspect hosted runs in the VoltOps console'
        )
      ),
  };
}

function resultStatus(
  params: AddEvalResultParams
): AppendEvalRunResultPayload['status'] {
  // The hosted union has no skipped status; "pending" is its neutral not-evaluated value.
  if (isSkipped(params)) return 'pending';
  if (typeof params.metadata?.executionError === 'string') return 'error';
  return params.passed ? 'passed' : 'failed';
}

function isSkipped(params: AddEvalResultParams): boolean {
  return params.metadata?.state === 'skipped';
}
