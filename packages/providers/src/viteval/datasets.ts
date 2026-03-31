import { createId } from '@paralleldrive/cuid2';
import { withResult } from '@viteval/internal';
import type {
  DatasetProvider,
  StoredDataItem,
  StoredDataset,
} from '@viteval/core';
import type { PrismaClient } from '@prisma/client';

/**
 * Create dataset operations backed by Prisma.
 *
 * @param prisma - The Prisma client instance.
 * @returns A DatasetProvider implementation.
 */
export function createDatasetOps(prisma: PrismaClient): DatasetProvider {
  return {
    addItems: (params) =>
      withResult(async () => {
        await prisma.$transaction(async (tx) => {
          const maxOrdinal = await tx.datasetItem
            .findFirst({
              orderBy: { ordinal: 'desc' },
              select: { ordinal: true },
              where: { datasetId: params.datasetId },
            })
            .then((r) => r?.ordinal ?? -1);

          await tx.datasetItem.createMany({
            data: params.items.map((item, i) => ({
              datasetId: params.datasetId,
              expected: JSON.stringify(item.expected),
              extra: JSON.stringify(item.extra ?? {}),
              id: createId(),
              input: JSON.stringify(item.input),
              ordinal: maxOrdinal + 1 + i,
            })),
          });

          await tx.dataset.update({
            data: { version: { increment: 1 } },
            where: { id: params.datasetId },
          });
        });
      }),

    create: (params) =>
      withResult(async () => {
        const dataset = await prisma.dataset.create({
          data: {
            description: params.description,
            id: createId(),
            items: params.items
              ? {
                  create: params.items.map((item, i) => ({
                    expected: JSON.stringify(item.expected),
                    extra: JSON.stringify(item.extra ?? {}),
                    id: createId(),
                    input: JSON.stringify(item.input),
                    ordinal: i,
                  })),
                }
              : undefined,
            metadata: JSON.stringify(params.metadata ?? {}),
            name: params.name,
          },
          include: { _count: { select: { items: true } } },
        });

        return mapDataset(dataset);
      }),

    delete: (params) =>
      withResult(async () => {
        await prisma.dataset.delete({ where: { id: params.id } });
      }),

    get: (params) =>
      withResult(async () => {
        const where = params.id
          ? { id: params.id }
          : params.name
            ? { name: params.name }
            : undefined;

        if (!where) {
          return null;
        }

        const dataset = await prisma.dataset.findUnique({
          include: { _count: { select: { items: true } } },
          where,
        });

        return dataset ? mapDataset(dataset) : null;
      }),

    getItems: (params) =>
      withResult(async () => {
        const items = await prisma.datasetItem.findMany({
          orderBy: { ordinal: 'asc' },
          skip: params.offset,
          take: params.limit,
          where: { datasetId: params.datasetId },
        });

        return items.map(mapDatasetItem);
      }),

    list: (params) =>
      withResult(async () => {
        const datasets = await prisma.dataset.findMany({
          include: { _count: { select: { items: true } } },
          orderBy: { updatedAt: 'desc' },
          skip: params?.offset,
          take: params?.limit,
        });

        return datasets.map(mapDataset);
      }),

    update: (params) =>
      withResult(async () => {
        const dataset = await prisma.dataset.update({
          data: {
            description: params.description,
            metadata: params.metadata
              ? JSON.stringify(params.metadata)
              : undefined,
            name: params.name,
          },
          include: { _count: { select: { items: true } } },
          where: { id: params.id },
        });

        return mapDataset(dataset);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapDataset(row: {
  id: string;
  name: string;
  description: string | null;
  version: number;
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { items: number };
}): StoredDataset {
  return {
    createdAt: row.createdAt,
    description: row.description ?? undefined,
    id: row.id,
    itemCount: row._count.items,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    name: row.name,
    updatedAt: row.updatedAt,
    version: row.version,
  };
}

function mapDatasetItem(row: {
  id: string;
  datasetId: string;
  input: string;
  expected: string;
  extra: string;
  ordinal: number;
}): StoredDataItem {
  return {
    datasetId: row.datasetId,
    expected: JSON.parse(row.expected) as unknown,
    extra: JSON.parse(row.extra) as Record<string, unknown>,
    id: row.id,
    input: JSON.parse(row.input) as unknown,
    ordinal: row.ordinal,
  };
}
