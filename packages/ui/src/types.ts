import type { JsonEvalResults, JsonEvalSuite } from '@viteval/core/reporters';

export type Score = Omit<
  JsonEvalSuite['evalResults'][number]['scores'][number],
  'score'
> & { score: number };
export type EvalResult = Omit<
  JsonEvalSuite['evalResults'][number],
  'scores'
> & { scores: Score[] };

export type EvalStatus = 'passed' | 'failed' | 'running';

export type EvalSuite = Omit<JsonEvalSuite, 'status' | 'evalResults'> & {
  status: EvalStatus;
  evalResults: EvalResult[];
};
export type EvalResults = Omit<JsonEvalResults, 'evalResults'> & {
  evalResults: EvalSuite[];
};

export interface ResultFile {
  id: string;
  runId: string;
  name: string;
  path: string;
  size: number;
  summary: {
    status?: 'running' | 'finished';
    success: boolean;
    numTotalEvalSuites: number;
    numPassedEvalSuites: number;
    numFailedEvalSuites: number;
    numTotalEvals: number;
    numPassedEvals: number;
    numFailedEvals: number;
    duration: number;
    startTime: number;
    endTime: number;
    suiteNames: string[];
    suiteIds: string[];
  } | null;
}

export interface DatasetSummary {
  id: string;
  name: string;
  path?: string;
  description?: string;
  itemCount: number;
  createdAt?: string;
  source: string;
}

export interface EvalSchema {
  id: string;
  name: string;
  path: string;
  content: string;
}

export interface SuiteSummary {
  name: string;
  slug: string;
  filepath?: string;
  runCount: number;
  latestStatus: EvalStatus;
  latestRunTimestamp: string;
  latestDuration: number;
  latestMeanScore: number;
  latestPassedCount: number;
  latestTotalCount: number;
}

export interface DatasetItem {
  id: string;
  name?: string;
  input: unknown;
  expected?: unknown;
  metadata?: Record<string, unknown>;
}

export interface DatasetFile {
  id: string;
  name: string;
  path?: string;
  description?: string;
  createdAt?: string;
  source: string;
  data: DatasetItem[];
}

export type TagEntityType =
  | 'eval_run'
  | 'eval_result'
  | 'dataset'
  | 'dataset_item';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
}

export interface Tagging {
  id: string;
  tagId: string;
  entityType: TagEntityType;
  entityId: string;
  createdAt: string;
}
