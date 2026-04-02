import * as fs from 'node:fs/promises';
import type { EvalResults, ResultFile } from '@/types';
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
  filePath: string,
  fileName: string
): Promise<ResultFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const results: EvalResults = JSON.parse(fileContent);
    const id = fileName.replace('.json', '');

    const suiteNames = results.evalResults?.map((s) => s.name) ?? [];

    return {
      id,
      name: results.runName || id,
      path: filePath,
      runId: results.runId || id,
      size: Buffer.byteLength(fileContent, 'utf8'),
      summary: {
        duration: results.duration,
        endTime: results.endTime,
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
  } catch {
    return null;
  }
}

export function createResultsResource(fsHelper: FsHelper): ResultsResource {
  async function loadAll(): Promise<ResultFile[]> {
    const ids = await fsHelper.listJsonIds('results');
    const parsed = await Promise.all(
      ids.map((id) =>
        parseResultFile(fsHelper.filePath('results', id), `${id}.json`)
      )
    );
    return parsed
      .filter((f): f is ResultFile => f !== null)
      .toSorted(
        (a, b) => (b.summary?.startTime ?? 0) - (a.summary?.startTime ?? 0)
      );
  }

  return {
    async get(
      params: GetResultParams
    ): Promise<VitevalResponse<EvalResults | null>> {
      const data = await fsHelper.readJson<EvalResults>(
        `results/${params.id}.json`
      );
      return { data };
    },

    async list(
      params?: ListResultsParams
    ): Promise<VitevalListResponse<ResultFile>> {
      let items = await loadAll();

      if (params?.status) {
        items = items.filter((r) => r.summary?.status === params.status);
      }

      if (params?.suite) {
        items = items.filter((r) =>
          r.summary?.suiteNames?.includes(params.suite!)
        );
      }

      return paginate(items, params?.page, params?.limit);
    },
  };
}
