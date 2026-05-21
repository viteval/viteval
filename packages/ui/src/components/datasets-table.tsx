'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { DatasetSummary, Tag } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ProviderBadge } from '@/components/display';
import { TagChip, useTags } from '@/components/tag';

interface DatasetRow extends DatasetSummary {
  tags: Tag[];
}

const columns: ColumnDef<DatasetRow>[] = [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.name}</span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: 'description',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1">
        {row.original.description || '-'}
      </span>
    ),
    enableSorting: false,
    header: 'Description',
  },
  {
    accessorKey: 'itemCount',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.itemCount} items</Badge>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
  },
  {
    accessorKey: 'source',
    cell: ({ row }) => <ProviderBadge provider={row.original.source} />,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
  },
  {
    accessorFn: (row) => row.tags.map((t) => t.name).join(','),
    cell: ({ row }) =>
      row.original.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    enableSorting: false,
    header: 'Tags',
    id: 'tags',
  },
];

interface DatasetsTableProps {
  datasets: DatasetSummary[];
}

export function DatasetsTable({ datasets }: DatasetsTableProps) {
  const router = useRouter();
  const ids = useMemo(() => datasets.map((d) => d.id), [datasets]);
  const { tagsByEntity } = useTags('dataset', ids);

  const rows = useMemo<DatasetRow[]>(
    () =>
      datasets.map((d) => ({
        ...d,
        tags: tagsByEntity[d.id] ?? [],
      })),
    [datasets, tagsByEntity]
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      onRowClick={(row) => router.push(`/datasets/${row.id}`)}
    />
  );
}
