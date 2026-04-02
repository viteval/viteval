import type {
  DatasetFile,
  DatasetSummary,
  EvalResults,
  EvalSchema,
  ResultFile,
  SuiteSummary,
} from '@/types';

/*
|------------------
| Response Types
|------------------
*/

export interface VitevalResponse<T> {
  data: T;
}

export interface VitevalListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/*
|------------------
| Param Types
|------------------
*/

export interface ListParams {
  page?: number;
  limit?: number;
}

export interface ListResultsParams extends ListParams {
  status?: 'running' | 'finished';
  suite?: string;
}

export interface GetResultParams {
  id: string;
}

export interface ListSuitesParams extends ListParams {
  status?: 'passed' | 'failed';
}

export interface GetSuiteParams {
  slug: string;
}

export interface ListDatasetsParams extends ListParams {}

export interface GetDatasetParams {
  id: string;
}

export interface GetSchemaParams {
  id: string;
}

/*
|------------------
| Resource Interfaces
|------------------
*/

export interface ResultsResource {
  list(params?: ListResultsParams): Promise<VitevalListResponse<ResultFile>>;
  get(params: GetResultParams): Promise<VitevalResponse<EvalResults | null>>;
}

export interface SuitesResource {
  list(params?: ListSuitesParams): Promise<VitevalListResponse<SuiteSummary>>;
  get(params: GetSuiteParams): Promise<VitevalResponse<SuiteSummary | null>>;
}

export interface DatasetsResource {
  list(
    params?: ListDatasetsParams
  ): Promise<VitevalListResponse<DatasetSummary>>;
  get(params: GetDatasetParams): Promise<VitevalResponse<DatasetFile | null>>;
}

export interface SchemasResource {
  list(): Promise<VitevalListResponse<EvalSchema>>;
  get(params: GetSchemaParams): Promise<VitevalResponse<EvalSchema | null>>;
}

/*
|------------------
| Client Interface
|------------------
*/

export interface Viteval {
  results: ResultsResource;
  suites: SuitesResource;
  datasets: DatasetsResource;
  schemas: SchemasResource;
}

export interface CreateVitevalParams {
  root?: string;
}
