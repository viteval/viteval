import type { EvalResults, SuiteSummary } from '@/types';
import { slugify } from '@/lib/utils';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import type {
  GetSuiteParams,
  ListSuitesParams,
  SuitesResource,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

export function createSuitesResource(fsHelper: FsHelper): SuitesResource {
  async function aggregateSuites(): Promise<SuiteSummary[]> {
    const ids = await fsHelper.listJsonIds('results');

    const allResults = await Promise.all(
      ids.map((id) => fsHelper.readJson<EvalResults>(`results/${id}.json`))
    );

    const suiteMap = new Map<string, SuiteSummary>();

    for (const result of allResults) {
      if (!result?.evalResults) {
        continue;
      }

      for (const suite of result.evalResults) {
        const existing = suiteMap.get(suite.name);
        if (existing) {
          existing.runCount++;
        } else {
          suiteMap.set(suite.name, {
            filepath: suite.filepath,
            latestDuration: suite.duration,
            latestMeanScore: suite.summary.meanScore,
            latestPassedCount: suite.summary.passedCount,
            latestRunTimestamp: String(result.startTime),
            latestStatus: suite.status,
            latestTotalCount: suite.summary.totalCount,
            name: suite.name,
            runCount: 1,
            slug: slugify(suite.name),
          });
        }
      }
    }

    return [...suiteMap.values()].toSorted((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  return {
    async get(
      params: GetSuiteParams
    ): Promise<VitevalResponse<SuiteSummary | null>> {
      const all = await aggregateSuites();
      const data = all.find((s) => s.slug === params.slug) ?? null;
      return { data };
    },

    async list(
      params?: ListSuitesParams
    ): Promise<VitevalListResponse<SuiteSummary>> {
      let items = await aggregateSuites();

      if (params?.status) {
        items = items.filter((s) => s.latestStatus === params.status);
      }

      return paginate(items, params?.page, params?.limit);
    },
  };
}
