import {
  createJsonProvider,
  type StoredTag,
  type StoredTagging,
} from '@viteval/core/provider';
import { type Result } from 'massaman/control';
import type { Tag, TagEntityType, Tagging } from '@/types';
import type { FsHelper } from '../fs';
import type {
  AddTaggingParams,
  CreateTagParams,
  DeleteTagParams,
  ListEntitiesForTagParams,
  ListTaggingsParams,
  RemoveTaggingParams,
  TagsResource,
  UpdateTagParams,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

export function createTagsResource(fsHelper: FsHelper): TagsResource {
  const provider = createJsonProvider({ root: fsHelper.root }).tags!;
  return {
    async addTagging(
      params: AddTaggingParams
    ): Promise<VitevalResponse<Tagging>> {
      return response(await provider.addTagging(params), toTagging);
    },

    async create(params: CreateTagParams): Promise<VitevalResponse<Tag>> {
      return response(await provider.create(params), toTag);
    },

    async delete(params: DeleteTagParams): Promise<VitevalResponse<null>> {
      return response(await provider.delete(params), () => null);
    },

    async list(): Promise<VitevalListResponse<Tag>> {
      return listResponse(await provider.list(), toTag);
    },

    async listEntitiesForTag(
      params: ListEntitiesForTagParams
    ): Promise<VitevalListResponse<Tagging>> {
      return listResponse(await provider.listEntitiesForTag(params), toTagging);
    },

    async listTaggings(
      params: ListTaggingsParams
    ): Promise<VitevalListResponse<Tag>> {
      return listResponse(await provider.listTaggings(params), toTag);
    },

    async listTaggingsForEntities(
      entityType: TagEntityType,
      entityIds: string[]
    ): Promise<VitevalResponse<Record<string, Tag[]>>> {
      const results = await Promise.all(
        entityIds.map(async (entityId) => ({
          entityId,
          result: await provider.listTaggings({ entityType, entityId }),
        }))
      );
      const failed = results.find(({ result }) => !result.ok);
      if (failed && !failed.result.ok)
        return { error: failed.result.error.message };
      return {
        data: Object.fromEntries(
          results.map(({ entityId, result }) => [
            entityId,
            result.ok ? result.value.map(toTag) : [],
          ])
        ),
      };
    },

    async removeTagging(
      params: RemoveTaggingParams
    ): Promise<VitevalResponse<null>> {
      return response(await provider.removeTagging(params), () => null);
    },

    async update(params: UpdateTagParams): Promise<VitevalResponse<Tag>> {
      return response(await provider.update(params), toTag);
    },
  };
}

function toTag(tag: StoredTag): Tag {
  return { ...tag, createdAt: tag.createdAt.toISOString() };
}
function toTagging(tagging: StoredTagging): Tagging {
  return { ...tagging, createdAt: tagging.createdAt.toISOString() };
}
function response<T, U>(
  result: Result<T>,
  convert: (value: T) => U
): VitevalResponse<U> {
  return result.ok
    ? { data: convert(result.value) }
    : { error: result.error.message };
}
function listResponse<T, U>(
  result: Result<T[]>,
  convert: (value: T) => U
): VitevalListResponse<U> {
  const data = result.ok ? result.value.map(convert) : [];
  return {
    data,
    hasMore: false,
    limit: data.length,
    page: 1,
    total: data.length,
    warnings: result.ok ? [] : [result.error.message],
  };
}
