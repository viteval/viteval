import { randomUUID } from 'node:crypto';
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

const TAGS_FILE = 'tags.json';
const TAGGINGS_FILE = 'taggings.json';

export function createTagsResource(fsHelper: FsHelper): TagsResource {
  async function loadTags(): Promise<Tag[]> {
    return (await fsHelper.readJson<Tag[]>(TAGS_FILE)) ?? [];
  }

  async function loadTaggings(): Promise<Tagging[]> {
    return (await fsHelper.readJson<Tagging[]>(TAGGINGS_FILE)) ?? [];
  }

  async function saveTags(tags: Tag[]): Promise<void> {
    await fsHelper.writeJson(TAGS_FILE, tags);
  }

  async function saveTaggings(taggings: Tagging[]): Promise<void> {
    await fsHelper.writeJson(TAGGINGS_FILE, taggings);
  }

  return {
    async addTagging(
      params: AddTaggingParams
    ): Promise<VitevalResponse<Tagging>> {
      const taggings = await loadTaggings();
      const existing = taggings.find(
        (t) =>
          t.tagId === params.tagId &&
          t.entityType === params.entityType &&
          t.entityId === params.entityId
      );
      if (existing) {
        return { data: existing };
      }
      const tagging: Tagging = {
        createdAt: new Date().toISOString(),
        entityId: params.entityId,
        entityType: params.entityType,
        id: randomUUID(),
        tagId: params.tagId,
      };
      await saveTaggings([...taggings, tagging]);
      return { data: tagging };
    },

    async create(params: CreateTagParams): Promise<VitevalResponse<Tag>> {
      const tags = await loadTags();
      const existing = tags.find(
        (t) => t.name.toLowerCase() === params.name.toLowerCase()
      );
      if (existing) {
        return { data: existing };
      }
      const tag: Tag = {
        color: params.color,
        createdAt: new Date().toISOString(),
        description: params.description,
        id: randomUUID(),
        name: params.name,
      };
      await saveTags([...tags, tag]);
      return { data: tag };
    },

    async delete(params: DeleteTagParams): Promise<VitevalResponse<null>> {
      const tags = await loadTags();
      const taggings = await loadTaggings();
      await saveTags(tags.filter((t) => t.id !== params.id));
      await saveTaggings(taggings.filter((t) => t.tagId !== params.id));
      return { data: null };
    },

    async list(): Promise<VitevalListResponse<Tag>> {
      const tags = await loadTags();
      const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));
      return {
        data: sorted,
        hasMore: false,
        limit: sorted.length,
        page: 1,
        total: sorted.length,
      };
    },

    async listEntitiesForTag(
      params: ListEntitiesForTagParams
    ): Promise<VitevalListResponse<Tagging>> {
      const taggings = await loadTaggings();
      const filtered = taggings.filter(
        (t) =>
          t.tagId === params.tagId &&
          (!params.entityType || t.entityType === params.entityType)
      );
      return {
        data: filtered,
        hasMore: false,
        limit: filtered.length,
        page: 1,
        total: filtered.length,
      };
    },

    async listTaggings(
      params: ListTaggingsParams
    ): Promise<VitevalListResponse<Tag>> {
      const [tags, taggings] = await Promise.all([loadTags(), loadTaggings()]);
      const tagIds = new Set(
        taggings
          .filter(
            (t) =>
              t.entityType === params.entityType &&
              t.entityId === params.entityId
          )
          .map((t) => t.tagId)
      );
      const matched = tags.filter((t) => tagIds.has(t.id));
      return {
        data: matched,
        hasMore: false,
        limit: matched.length,
        page: 1,
        total: matched.length,
      };
    },

    async listTaggingsForEntities(
      entityType: TagEntityType,
      entityIds: string[]
    ): Promise<VitevalResponse<Record<string, Tag[]>>> {
      const [tags, taggings] = await Promise.all([loadTags(), loadTaggings()]);
      const tagMap = new Map(tags.map((t) => [t.id, t]));
      const result: Record<string, Tag[]> = {};
      for (const id of entityIds) {
        result[id] = [];
      }
      for (const tagging of taggings) {
        if (tagging.entityType !== entityType || !result[tagging.entityId]) {
          continue;
        }
        const tag = tagMap.get(tagging.tagId);
        if (tag) {
          result[tagging.entityId]!.push(tag);
        }
      }
      return { data: result };
    },

    async removeTagging(
      params: RemoveTaggingParams
    ): Promise<VitevalResponse<null>> {
      const taggings = await loadTaggings();
      await saveTaggings(
        taggings.filter(
          (t) =>
            !(
              t.tagId === params.tagId &&
              t.entityType === params.entityType &&
              t.entityId === params.entityId
            )
        )
      );
      return { data: null };
    },

    async update(params: UpdateTagParams): Promise<VitevalResponse<Tag>> {
      const tags = await loadTags();
      const index = tags.findIndex((t) => t.id === params.id);
      if (index === -1) {
        throw new Error(`Tag not found: ${params.id}`);
      }
      const next: Tag = {
        ...tags[index]!,
        color: params.color ?? tags[index]!.color,
        description: params.description ?? tags[index]!.description,
        name: params.name ?? tags[index]!.name,
      };
      const updated = [...tags];
      updated[index] = next;
      await saveTags(updated);
      return { data: next };
    },
  };
}
