'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import type { DatasetSummary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const columns: ColumnDef<DatasetSummary>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1">
        {row.original.description || '-'}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'path',
    header: 'Path',
    cell: ({ row }) => (
      <code className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
        {row.original.path}
      </code>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'itemCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.itemCount} items</Badge>
    ),
  },
  {
    accessorKey: 'storage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Storage" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.storage}</span>
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
