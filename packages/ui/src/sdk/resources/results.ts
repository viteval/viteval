import type { EvalResults, ResultFile } from '@/types';
import { EVAL_RESULTS_SCHEMA } from '@viteval/core/reporters';
import { suiteName } from '@/lib/suite-name';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import type {
  GetResultParams,
  ListResultsParams,
  ResultsResource,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

async function parseResultFile(
  id: string,
  fsHelper: FsHelper
): Promise<ResultFile | null> {
  const raw = await fsHelper.readRawFile(`results/${id}.json`);
  if (!raw) {
    return null;
  }
  let results: EvalResults;
  try {
    results = EVAL_RESULTS_SCHEMA.parse(JSON.parse(raw));
  } catch {
    return null;
  }

  const suiteNames = results.evalResults.map(suiteName);

  return {
    id,
    name: results.runName || id,
    path: fsHelper.relativePath(fsHelper.filePath('results', id)),
    runId: results.runId || id,
    size: Buffer.byteLength(raw, 'utf8'),
    summary: {
      duration: results.duration ?? 0,
      endTime: results.endTime ?? results.startTime,
      numFailedEvalSuites: results.numFailedEvalSuites,
      numFailedEvals: results.numFailedEvals,
      numPassedEvalSuites: results.numPassedEvalSuites,
      numPassedEvals: results.numPassedEvals,
      numTotalEvalSuites: results.numTotalEvalSuites,
      numTotalEvals: results.numTotalEvals,
      startTime: results.startTime,
      status: results.status,
      success: results.success,
      suiteNames,
    },
  };
}

export function createResultsResource(fsHelper: FsHelper): ResultsResource {
  async function loadAll() {
    const ids = await fsHelper.listJsonIds('results');
    const parsed = await Promise.all(
      ids.map((id) => parseResultFile(id, fsHelper))
    );
    const items = parsed
      .filter((f): f is ResultFile => f !== null)
      .toSorted(
        (a, b) => (b.summary?.startTime ?? 0) - (a.summary?.startTime ?? 0)
      );
    return {
      items,
      warnings: ids
        .filter((_id, index) => parsed[index] === null)
        .map((id) => `Invalid result file: ${id}.json`),
    };
  }

  return {
    async get(
      params: GetResultParams
    ): Promise<VitevalResponse<EvalResults | null>> {
      const text = await fsHelper.readRawFile(`results/${params.id}.json`);
      if (text === null) return { data: null };
      try {
        const parsed = EVAL_RESULTS_SCHEMA.safeParse(JSON.parse(text));
        return parsed.success
          ? { data: parsed.data }
          : { error: `Invalid evaluation result file: ${params.id}` };
      } catch {
        return { error: `Invalid evaluation result file: ${params.id}` };
      }
    },

    async list(
      params?: ListResultsParams
    ): Promise<VitevalListResponse<ResultFile>> {
      const loaded = await loadAll();
      let items = loaded.items;

      if (params?.status) {
        items = items.filter((r) => r.summary?.status === params.status);
      }

      if (params?.suite) {
        items = items.filter((r) =>
          r.summary?.suiteNames?.includes(params.suite!)
        );
      }

      return {
        ...paginate(items, { limit: params?.limit, page: params?.page }),
        warnings: loaded.warnings,
      };
    },
  };
}
