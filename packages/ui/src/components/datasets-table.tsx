'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import type { DatasetSummary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { FilePath } from '@/components/display';

const columns: ColumnDef<DatasetSummary>[] = [
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
    accessorKey: 'path',
    cell: ({ row }) => (
      <FilePath path={row.original.path} />
    ),
    enableSorting: false,
    header: 'Path',
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
    accessorKey: 'storage',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.storage}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Storage" />
    ),
  },
];

interface DatasetsTableProps {
  datasets: DatasetSummary[];
}

export function DatasetsTable({ datasets }: DatasetsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={datasets}
      onRowClick={(row) => router.push(`/datasets/${row.id}`)}
    />
  );
}
