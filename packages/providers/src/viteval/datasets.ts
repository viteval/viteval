import { createId } from '@paralleldrive/cuid2';
import { withResult } from '@viteval/internal';
import type {
  DatasetProvider,
  StoredDataItem,
  StoredDataset,
} from '@viteval/core';
import type { PrismaClient } from '#/generated/client';

/**
 * Create dataset operations backed by Prisma.
 *
 * @param prisma - The Prisma client instance.
 * @returns A DatasetProvider implementation.
 */
export function createDatasetOps(prisma: PrismaClient): DatasetProvider {
  return {
    create: (params) =>
      withResult(async () => {
        const dataset = await prisma.dataset.create({
          data: {
            id: createId(),
            name: params.name,
            description: params.description,
            metadata: JSON.stringify(params.metadata ?? {}),
            items: params.items
              ? {
                  create: params.items.map((item, i) => ({
                    id: createId(),
                    input: JSON.stringify(item.input),
                    expected: JSON.stringify(item.expected),
                    extra: JSON.stringify(item.extra ?? {}),
                    ordinal: i,
                  })),
                }
              : undefined,
          },
          include: { _count: { select: { items: true } } },
        });

        return mapDataset(dataset);
      }),

    get: (params) =>
      withResult(async () => {
        const where = params.id
          ? { id: params.id }
          : params.name
            ? { name: params.name }
            : undefined;

        if (!where) return null;

        const dataset = await prisma.dataset.findUnique({
          where,
          include: { _count: { select: { items: true } } },
        });

        return dataset ? mapDataset(dataset) : null;
      }),

    list: (params) =>
      withResult(async () => {
        const datasets = await prisma.dataset.findMany({
          take: params?.limit,
          skip: params?.offset,
          orderBy: { updatedAt: 'desc' },
          include: { _count: { select: { items: true } } },
        });

        return datasets.map(mapDataset);
      }),

    update: (params) =>
      withResult(async () => {
        const dataset = await prisma.dataset.update({
          where: { id: params.id },
          data: {
            name: params.name,
            description: params.description,
            metadata: params.metadata
              ? JSON.stringify(params.metadata)
              : undefined,
          },
          include: { _count: { select: { items: true } } },
        });

        return mapDataset(dataset);
      }),

    delete: (params) =>
      withResult(async () => {
        await prisma.dataset.delete({ where: { id: params.id } });
      }),

    getItems: (params) =>
      withResult(async () => {
        const items = await prisma.datasetItem.findMany({
          where: { datasetId: params.datasetId },
          take: params.limit,
          skip: params.offset,
          orderBy: { ordinal: 'asc' },
        });

        return items.map(mapDatasetItem);
      }),

    addItems: (params) =>
      withResult(async () => {
        await prisma.$transaction(async (tx) => {
          const maxOrdinal = await tx.datasetItem
            .findFirst({
              where: { datasetId: params.datasetId },
              orderBy: { ordinal: 'desc' },
              select: { ordinal: true },
            })
            .then((r) => r?.ordinal ?? -1);

          await tx.datasetItem.createMany({
            data: params.items.map((item, i) => ({
              id: createId(),
              datasetId: params.datasetId,
              input: JSON.stringify(item.input),
              expected: JSON.stringify(item.expected),
              extra: JSON.stringify(item.extra ?? {}),
              ordinal: maxOrdinal + 1 + i,
            })),
          });

          await tx.dataset.update({
            where: { id: params.datasetId },
            data: { version: { increment: 1 } },
          });
        });
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapDataset(
  row: {
    id: string;
    name: string;
    description: string | null;
    version: number;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { items: number };
  }
): StoredDataset {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    version: row.version,
    itemCount: row._count.items,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapDatasetItem(
  row: {
    id: string;
    datasetId: string;
    input: string;
    expected: string;
    extra: string;
    ordinal: number;
  }
): StoredDataItem {
  return {
    id: row.id,
    datasetId: row.datasetId,
    input: JSON.parse(row.input) as unknown,
    expected: JSON.parse(row.expected) as unknown,
    extra: JSON.parse(row.extra) as Record<string, unknown>,
    ordinal: row.ordinal,
  };
}
