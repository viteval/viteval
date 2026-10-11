import type { SuiteSummary } from '@/types';
import { EVAL_RESULTS_SCHEMA } from '@viteval/core/reporters';
import { slugify } from '@/lib/utils';
import { suiteName } from '@/lib/suite-name';
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
      ids.map(async (id) => {
        const raw = await fsHelper.readJson<unknown>(`results/${id}.json`);
        const parsed = EVAL_RESULTS_SCHEMA.safeParse(raw);
        return parsed.success ? parsed.data : null;
      })
    );

    const suiteMap = new Map<string, SuiteSummary>();

    for (const result of allResults) {
      if (!result?.evalResults) {
        continue;
      }
      const runTimestamp = String(result.startTime);

      for (const suite of result.evalResults) {
        const name = suiteName(suite);
        const existing = suiteMap.get(name);
        if (!existing) {
          suiteMap.set(name, {
            filepath: suite.filepath,
            latestDuration: suite.duration,
            latestMeanScore: suite.summary.meanScore,
            latestPassedCount: suite.summary.passedCount,
            latestRunTimestamp: runTimestamp,
            latestStatus:
              result.status === 'running' ? 'running' : suite.status,
            latestTotalCount: suite.summary.totalCount,
            name,
            runCount: 1,
            slug: slugify(name),
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
          existing.latestStatus =
            result.status === 'running' ? 'running' : suite.status;
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
