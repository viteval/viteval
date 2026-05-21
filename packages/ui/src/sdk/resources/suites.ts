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
      const runTimestamp = String(result.startTime);

      for (const suite of result.evalResults) {
        const existing = suiteMap.get(suite.name);
        if (!existing) {
          suiteMap.set(suite.name, {
            filepath: suite.filepath,
            latestDuration: suite.duration,
            latestMeanScore: suite.summary.meanScore,
            latestPassedCount: suite.summary.passedCount,
            latestRunTimestamp: runTimestamp,
            latestStatus: suite.status,
            latestTotalCount: suite.summary.totalCount,
            name: suite.name,
            runCount: 1,
            slug: slugify(suite.name),
          });
          continue;
        }

        existing.runCount++;
        // Always update "latest*" when this run is newer than the one we have
        // already recorded. Timestamps are numeric ms strings — compare as numbers.
        if (Number(runTimestamp) > Number(existing.latestRunTimestamp)) {
          existing.filepath = suite.filepath ?? existing.filepath;
          existing.latestDuration = suite.duration;
          existing.latestMeanScore = suite.summary.meanScore;
          existing.latestPassedCount = suite.summary.passedCount;
          existing.latestRunTimestamp = runTimestamp;
          existing.latestStatus = suite.status;
          existing.latestTotalCount = suite.summary.totalCount;
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

      return paginate(items, { limit: params?.limit, page: params?.page });
    },
  };
}
