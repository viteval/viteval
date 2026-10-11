import { randomUUID } from 'node:crypto';
import { attemptAsync } from 'massaman/control';
import { z } from 'zod';
import type { JsonStore } from './json-store';
import type { TagProvider } from './types';

const TAG_SCHEMA = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.coerce.date(),
});
const TAGGING_SCHEMA = z.object({
  id: z.string(),
  tagId: z.string(),
  entityType: z.enum(['eval_run', 'eval_result', 'dataset', 'dataset_item']),
  entityId: z.string(),
  createdAt: z.coerce.date(),
});
const TAGS_FILE_SCHEMA = z
  .union([
    z.array(TAG_SCHEMA),
    z.object({ schemaVersion: z.literal(1), tags: z.array(TAG_SCHEMA) }),
  ])
  .transform((value) => (Array.isArray(value) ? value : value.tags));
const TAGGINGS_FILE_SCHEMA = z
  .union([
    z.array(TAGGING_SCHEMA),
    z.object({
      schemaVersion: z.literal(1),
      taggings: z.array(TAGGING_SCHEMA),
    }),
  ])
  .transform((value) => (Array.isArray(value) ? value : value.taggings));

/**
 * Create tagging operations over JSON storage.
 * @param store - Project storage.
 * @returns Tag provider operations.
 * @example const tags = createJsonTags(store);
 */
export function createJsonTags(store: JsonStore): TagProvider {
  const tags = async () =>
    (await store.read('tags.json', TAGS_FILE_SCHEMA)) ?? [];
  const taggings = async () =>
    (await store.read('taggings.json', TAGGINGS_FILE_SCHEMA)) ?? [];
  return {
    list: (params) =>
      attemptAsync(async () =>
        (await tags())
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .slice(
            params?.offset ?? 0,
            params?.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          )
      ),
    create: (params) =>
      attemptAsync(() =>
        store.update('tags.json', async () => {
          const current = await tags();
          const existing = current.find(
            (tag) => tag.name.toLowerCase() === params.name.toLowerCase()
          );
          if (existing) return existing;
          const tag = TAG_SCHEMA.parse({
            ...params,
            id: randomUUID(),
            createdAt: new Date(),
          });
          await store.write('tags.json', {
            schemaVersion: 1,
            tags: [...current, tag],
          });
          return tag;
        })
      ),
    update: (params) =>
      attemptAsync(() =>
        store.update('tags.json', async () => {
          const current = await tags();
          const tag = current.find((candidate) => candidate.id === params.id);
          if (!tag) throw new Error(`Tag not found: ${params.id}`);
          if (
            params.name &&
            current.some(
              (candidate) =>
                candidate.id !== params.id &&
                candidate.name.toLowerCase() === params.name?.toLowerCase()
            )
          )
            throw new Error(`Tag already exists: ${params.name}`);
          const next = TAG_SCHEMA.parse({ ...tag, ...params });
          await store.write('tags.json', {
            schemaVersion: 1,
            tags: current.map((candidate) =>
              candidate.id === params.id ? next : candidate
            ),
          });
          return next;
        })
      ),
    delete: (params) =>
      attemptAsync(() =>
        store.update('tags.json', () =>
          store.update('taggings.json', async () => {
            await store.write('taggings.json', {
              schemaVersion: 1,
              taggings: (await taggings()).filter(
                (tagging) => tagging.tagId !== params.id
              ),
            });
            await store.write('tags.json', {
              schemaVersion: 1,
              tags: (await tags()).filter((tag) => tag.id !== params.id),
            });
          })
        )
      ),
    addTagging: (params) =>
      attemptAsync(() =>
        store.update('tags.json', () =>
          store.update('taggings.json', async () => {
            if (!(await tags()).some((tag) => tag.id === params.tagId))
              throw new Error(`Tag not found: ${params.tagId}`);
            const current = await taggings();
            const existing = current.find(
              (tagging) =>
                tagging.tagId === params.tagId &&
                tagging.entityId === params.entityId &&
                tagging.entityType === params.entityType
            );
            if (existing) return existing;
            const tagging = TAGGING_SCHEMA.parse({
              ...params,
              id: randomUUID(),
              createdAt: new Date(),
            });
            await store.write('taggings.json', {
              schemaVersion: 1,
              taggings: [...current, tagging],
            });
            return tagging;
          })
        )
      ),
    removeTagging: (params) =>
      attemptAsync(() =>
        store.update('taggings.json', async () => {
          await store.write('taggings.json', {
            schemaVersion: 1,
            taggings: (await taggings()).filter(
              (tagging) =>
                !(
                  tagging.tagId === params.tagId &&
                  tagging.entityId === params.entityId &&
                  tagging.entityType === params.entityType
                )
            ),
          });
        })
      ),
    listTaggings: (params) =>
      attemptAsync(async () => {
        const ids = new Set(
          (await taggings())
            .filter(
              (tagging) =>
                tagging.entityId === params.entityId &&
                tagging.entityType === params.entityType
            )
            .map((tagging) => tagging.tagId)
        );
        return (await tags()).filter((tag) => ids.has(tag.id));
      }),
    listEntitiesForTag: (params) =>
      attemptAsync(async () =>
        (await taggings()).filter(
          (tagging) =>
            tagging.tagId === params.tagId &&
            (!params.entityType || tagging.entityType === params.entityType)
        )
      ),
  };
}
