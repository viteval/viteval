import { createId } from '@paralleldrive/cuid2';
import { withResult } from '@viteval/internal';
import type {
  StoredTag,
  StoredTagging,
  TagEntityType,
  TagProvider,
} from '@viteval/core';
import type { PrismaClient } from '@prisma/client';

/**
 * Create tag operations backed by Prisma.
 *
 * @param prisma - The Prisma client instance.
 * @returns A TagProvider implementation.
 *
 * @example
 * ```ts
 * const tagOps = createTagOps(prisma);
 * await tagOps.create({ name: 'false-negative', color: 'red' });
 * ```
 */
export function createTagOps(prisma: PrismaClient): TagProvider {
  return {
    addTagging: (params) =>
      withResult(async () => {
        const tagging = await prisma.tagging.upsert({
          create: {
            entityId: params.entityId,
            entityType: params.entityType,
            id: createId(),
            tagId: params.tagId,
          },
          update: {},
          where: {
            tagId_entityType_entityId: {
              entityId: params.entityId,
              entityType: params.entityType,
              tagId: params.tagId,
            },
          },
        });

        return mapTagging(tagging);
      }),

    create: (params) =>
      withResult(async () => {
        const tag = await prisma.tag.create({
          data: {
            color: params.color,
            description: params.description,
            id: createId(),
            name: params.name,
          },
        });

        return mapTag(tag);
      }),

    delete: (params) =>
      withResult(async () => {
        await prisma.tag.delete({ where: { id: params.id } });
      }),

    list: (params) =>
      withResult(async () => {
        const tags = await prisma.tag.findMany({
          orderBy: { name: 'asc' },
          skip: params?.offset,
          take: params?.limit,
        });

        return tags.map(mapTag);
      }),

    listEntitiesForTag: (params) =>
      withResult(async () => {
        const taggings = await prisma.tagging.findMany({
          orderBy: { createdAt: 'desc' },
          where: {
            entityType: params.entityType,
            tagId: params.tagId,
          },
        });

        return taggings.map(mapTagging);
      }),

    listTaggings: (params) =>
      withResult(async () => {
        const taggings = await prisma.tagging.findMany({
          include: { tag: true },
          orderBy: { createdAt: 'asc' },
          where: {
            entityId: params.entityId,
            entityType: params.entityType,
          },
        });

        return taggings.map((t) => mapTag(t.tag));
      }),

    removeTagging: (params) =>
      withResult(async () => {
        await prisma.tagging.deleteMany({
          where: {
            entityId: params.entityId,
            entityType: params.entityType,
            tagId: params.tagId,
          },
        });
      }),

    update: (params) =>
      withResult(async () => {
        const tag = await prisma.tag.update({
          data: {
            color: params.color,
            description: params.description,
            name: params.name,
          },
          where: { id: params.id },
        });

        return mapTag(tag);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapTag(row: {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  createdAt: Date;
}): StoredTag {
  return {
    color: row.color ?? undefined,
    createdAt: row.createdAt,
    description: row.description ?? undefined,
    id: row.id,
    name: row.name,
  };
}

function mapTagging(row: {
  id: string;
  tagId: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}): StoredTagging {
  return {
    createdAt: row.createdAt,
    entityId: row.entityId,
    entityType: row.entityType as TagEntityType,
    id: row.id,
    tagId: row.tagId,
  };
}
