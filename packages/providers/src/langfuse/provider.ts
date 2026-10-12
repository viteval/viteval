import { createHash, randomUUID } from 'node:crypto';
import type { LangfuseClient } from '@langfuse/client';
import type {
  BasicTracerProvider,
  InMemorySpanExporter,
} from '@opentelemetry/sdk-trace-base';
import type { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { Context } from '@opentelemetry/api';
import { attemptAsync } from 'massaman/control';
import type {
  EvalProvider,
  Provider,
  StoredEvalRun,
  StoredEvalResult,
} from '@viteval/core';
import { serializeJson } from '@viteval/internal';
import {
  decodeResult,
  decodeRun,
  jsonValue,
  requireRecord,
} from '#/remote-record';
import { createLangfuseDatasets } from './datasets';

export interface LangfuseProviderOptions {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  /** SDK request timeout in seconds. */
  timeout?: number;
}

interface Runtime {
  client: LangfuseClient;
  telemetry: BasicTracerProvider;
  memory: InMemorySpanExporter;
  exporter: OTLPTraceExporter;
  rootContext: Context;
}

/** Create a Langfuse provider with isolated OpenTelemetry experiment export.
 * @param options - Explicit project credentials and optional regional/self-hosted URL.
 * @returns Dataset and hosted evaluation operations loaded only on initialization.
 * @example await initializeProvider(langfuse({ publicKey: 'pk', secretKey: 'sk' }));
 */
export function langfuse(options: LangfuseProviderOptions): Provider {
  let runtime: Runtime | undefined;
  let datasets: Provider['datasets'];
  let evals: Provider['evals'];
  return {
    name: 'langfuse',
    get datasets() {
      return datasets;
    },
    get evals() {
      return evals;
    },
    initialize: () =>
      attemptAsync(async () => {
        if (runtime) return;
        if (!options.publicKey?.trim() || !options.secretKey?.trim())
          throw new Error('Langfuse requires publicKey and secretKey');
        const imported = await attemptAsync(() =>
          Promise.all([
            import('@langfuse/client'),
            import('@opentelemetry/sdk-trace-base'),
            import('@opentelemetry/exporter-trace-otlp-http'),
            import('@opentelemetry/api'),
          ])
        );
        if (!imported.ok)
          throw new Error(
            'Install @langfuse/client @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http to use the Langfuse provider',
            { cause: imported.error }
          );
        const [sdk, tracing, otlp, api] = imported.value;
        const client = new sdk.LangfuseClient(options);
        const memory = new tracing.InMemorySpanExporter();
        const telemetry = new tracing.BasicTracerProvider({
          spanProcessors: [new tracing.SimpleSpanProcessor(memory)],
        });
        const baseUrl = options.baseUrl ?? 'https://cloud.langfuse.com';
        const exporter = new otlp.OTLPTraceExporter({
          url: `${baseUrl.replace(/\/$/, '')}/api/public/otel/v1/traces`,
          headers: {
            Authorization: `Basic ${Buffer.from(`${options.publicKey}:${options.secretKey}`).toString('base64')}`,
            'x-langfuse-ingestion-version': '4',
          },
          timeoutMillis: (options.timeout ?? 10) * 1_000,
        });
        runtime = {
          client,
          memory,
          telemetry,
          exporter,
          rootContext: api.ROOT_CONTEXT,
        };
        datasets = createLangfuseDatasets(client);
        evals = createLangfuseEvals(runtime);
      }),
    close: () =>
      attemptAsync(async () => {
        if (!runtime) return;
        await runtime.client.flush();
        await runtime.telemetry.shutdown();
        await runtime.exporter.shutdown();
        runtime = undefined;
        datasets = undefined;
        evals = undefined;
      }),
  };
}

function createLangfuseEvals(runtime: Runtime): EvalProvider {
  let runs = new Map<string, StoredEvalRun>();
  let pending = Promise.resolve();
  const tracer = runtime.telemetry.getTracer('viteval');
  async function sendSpan(params: {
    name: string;
    attributes: Record<string, string>;
    startTime?: Date;
    endTime?: Date;
  }) {
    let ids: { traceId: string; observationId: string } | undefined;
    const operation = pending.then(async () => {
      const span = tracer.startSpan(
        params.name,
        { attributes: params.attributes, startTime: params.startTime },
        runtime.rootContext
      );
      const context = span.spanContext();
      ids = { traceId: context.traceId, observationId: context.spanId };
      if ('langfuse.experiment.item.id' in params.attributes)
        span.setAttribute(
          'langfuse.experiment.item.root_observation_id',
          context.spanId
        );
      span.end(params.endTime);
      await runtime.telemetry.forceFlush();
      const spans = runtime.memory.getFinishedSpans();
      runtime.memory.reset();
      await new Promise<void>((resolve, reject) =>
        runtime.exporter.export(spans, (result) => {
          if (result.code !== 0)
            reject(
              result.error ??
                new Error('Langfuse rejected OpenTelemetry export')
            );
          else resolve();
        })
      );
    });
    pending = operation.then(
      () => undefined,
      () => undefined
    );
    await operation;
    if (!ids) throw new Error('Langfuse did not create an observation');
    return ids;
  }
  async function observations(params: { name?: string; sessionId?: string }) {
    const records: Awaited<
      ReturnType<LangfuseClient['api']['observations']['getMany']>
    >['data'] = [];
    let cursor: string | undefined;
    const seen = new Set<string>();
    do {
      const response = await runtime.client.api.observations.getMany({
        ...params,
        cursor,
        fields: 'core,basic,metadata',
        expandMetadata: 'viteval_run,viteval_result',
        limit: 100,
      });
      records.push(...response.data);
      cursor = response.meta.cursor ?? undefined;
      if (cursor && seen.has(cursor))
        throw new Error('Langfuse returned a repeated observations cursor');
      if (cursor) seen.add(cursor);
    } while (cursor);
    return records;
  }
  async function load(id: string): Promise<StoredEvalRun | null> {
    const local = runs.get(id);
    if (local) return local;
    const remote = await observations({ name: 'viteval.run', sessionId: id });
    if (!remote.length) return null;
    return decodeRun(
      requireRecord(
        typeof remote[0].metadata === 'string'
          ? JSON.parse(remote[0].metadata)
          : remote[0].metadata
      ).viteval_run
    );
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        jsonValue(params);
        const run: StoredEvalRun = {
          ...params,
          id: randomUUID(),
          status: 'running',
          startedAt: new Date(),
          metadata: params.metadata ?? {},
        };
        runs = new Map([...runs, [run.id, run]]);
        return run;
      }),
    addResult: (params) =>
      attemptAsync(async () => {
        const run = await load(params.evalRunId);
        if (!run || run.status !== 'running')
          throw new Error(`Run is missing or finalized: ${params.evalRunId}`);
        jsonValue(params);
        if (params.scores.some((score) => !Number.isFinite(score.score)))
          throw new Error('Langfuse scores must be finite');
        const id = randomUUID();
        const result: StoredEvalResult = {
          ...params,
          id,
          metadata: params.metadata ?? {},
        };
        const endTime = new Date();
        const ids = await sendSpan({
          name: 'viteval.case',
          startTime: new Date(endTime.getTime() - (params.duration ?? 0)),
          endTime,
          attributes: {
            'langfuse.environment': 'experiment',
            'langfuse.trace.name':
              typeof params.metadata?.name === 'string'
                ? params.metadata.name
                : 'Viteval case',
            'langfuse.session.id': run.id,
            'langfuse.experiment.id': run.id,
            'langfuse.experiment.name': `${run.name}-${run.id}`,
            'langfuse.experiment.dataset.id':
              run.datasetId ??
              createHash('sha256').update(run.name).digest('hex'),
            'langfuse.experiment.item.id':
              typeof params.metadata?.datasetItemId === 'string'
                ? params.metadata.datasetItemId
                : createHash('sha256')
                    .update(
                      serializeJson({
                        input: params.input,
                        expected: params.expected,
                      })
                    )
                    .digest('hex'),
            'langfuse.experiment.item.expected_output': serializeJson(
              params.expected
            ),
            'langfuse.observation.input': serializeJson(params.input),
            'langfuse.observation.output': serializeJson(params.output),
            'langfuse.observation.metadata.viteval_result':
              serializeJson(result),
            'langfuse.observation.level': params.passed ? 'DEFAULT' : 'ERROR',
            'langfuse.observation.status_message': statusMessage({
              error: params.metadata?.executionError,
              passed: params.passed,
            }),
          },
        });
        for (const score of params.scores) {
          await runtime.client.api.scores.create({
            id: `${id}-${score.name}`,
            traceId: ids.traceId,
            observationId: ids.observationId,
            name: score.name,
            value: score.score,
            dataType: 'NUMERIC',
          });
        }
        const latest = runs.get(run.id) ?? run;
        runs = new Map([
          ...runs,
          [run.id, { ...latest, results: [...(latest.results ?? []), result] }],
        ]);
        return result;
      }),
    complete: (params) =>
      attemptAsync(async () => {
        const run = await load(params.id);
        if (!run || run.status !== 'running')
          throw new Error(`Run is missing or finalized: ${params.id}`);
        const completed: StoredEvalRun = {
          ...run,
          status: params.status ?? 'completed',
          summary: params.summary,
          completedAt: new Date(),
        };
        const { results: _results, ...snapshot } = completed;
        await sendSpan({
          name: 'viteval.run',
          startTime: run.startedAt,
          endTime: completed.completedAt,
          attributes: {
            'langfuse.session.id': run.id,
            'langfuse.environment': 'experiment',
            'langfuse.observation.metadata.viteval_run':
              serializeJson(snapshot),
            'langfuse.observation.output': serializeJson(params.summary),
          },
        });
        runs = new Map([...runs, [run.id, completed]]);
        return completed;
      }),
    get: (params) =>
      attemptAsync(async () => {
        const run = await load(params.id);
        if (!run) return null;
        if (!params.includeResults) return { ...run, results: undefined };
        const records =
          run.results ??
          (await observations({ name: 'viteval.case', sessionId: run.id })).map(
            (observation) => {
              const metadata = requireRecord(
                typeof observation.metadata === 'string'
                  ? JSON.parse(observation.metadata)
                  : observation.metadata
              );
              return decodeResult(metadata.viteval_result);
            }
          );
        return { ...run, results: records };
      }),
    list: (params) =>
      attemptAsync(async () => {
        const remote = (await observations({ name: 'viteval.run' })).map(
          (observation) =>
            decodeRun(
              requireRecord(
                typeof observation.metadata === 'string'
                  ? JSON.parse(observation.metadata)
                  : observation.metadata
              ).viteval_run
            )
        );
        const merged = new Map(remote.map((run) => [run.id, run]));
        for (const [id, run] of runs) merged.set(id, run);
        return [...merged.values()]
          .filter(
            (run) =>
              (!params?.datasetId || run.datasetId === params.datasetId) &&
              (!params?.status || run.status === params.status)
          )
          .toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
          .slice(
            params?.offset ?? 0,
            params?.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          );
      }),
  };
}

function statusMessage(params: { error: unknown; passed: boolean }): string {
  if (typeof params.error === 'string') return params.error;
  return params.passed ? '' : 'Viteval evaluation threshold not met';
}
