import type {
  DatasetFile,
  DatasetSummary,
  EvalResults,
  EvalSchema,
  ResultFile,
  SuiteSummary,
  Tag,
  TagEntityType,
  Tagging,
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

export interface CreateTagParams {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagParams {
  id: string;
  name?: string;
  color?: string;
  description?: string;
}

export interface DeleteTagParams {
  id: string;
}

export interface AddTaggingParams {
  tagId: string;
  entityType: TagEntityType;
  entityId: string;
}

export interface RemoveTaggingParams {
  tagId: string;
  entityType: TagEntityType;
  entityId: string;
}

export interface ListTaggingsParams {
  entityType: TagEntityType;
  entityId: string;
}

export interface ListEntitiesForTagParams {
  tagId: string;
  entityType?: TagEntityType;
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

export interface TagsResource {
  list(): Promise<VitevalListResponse<Tag>>;
  create(params: CreateTagParams): Promise<VitevalResponse<Tag>>;
  update(params: UpdateTagParams): Promise<VitevalResponse<Tag>>;
  delete(params: DeleteTagParams): Promise<VitevalResponse<null>>;
  addTagging(params: AddTaggingParams): Promise<VitevalResponse<Tagging>>;
  removeTagging(params: RemoveTaggingParams): Promise<VitevalResponse<null>>;
  listTaggings(params: ListTaggingsParams): Promise<VitevalListResponse<Tag>>;
  listTaggingsForEntities(
    entityType: TagEntityType,
    entityIds: string[]
  ): Promise<VitevalResponse<Record<string, Tag[]>>>;
  listEntitiesForTag(
    params: ListEntitiesForTagParams
  ): Promise<VitevalListResponse<Tagging>>;
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
  tags: TagsResource;
}

export interface CreateVitevalParams {
  root?: string;
}
