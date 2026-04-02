'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { getStatusBadge } from '@/lib/badges';
import { formatDuration, formatPassRate, formatTimestamp } from '@/lib/utils';
import type { SuiteSummary } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const columns: ColumnDef<SuiteSummary>[] = [
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
    accessorKey: 'filepath',
    cell: ({ row }) =>
      row.original.filepath ? (
        <code className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
          {row.original.filepath}
        </code>
      ) : null,
    enableSorting: false,
    header: 'File',
  },
  {
    accessorKey: 'latestStatus',
    cell: ({ row }) => getStatusBadge(row.original.latestStatus),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
  {
    accessorKey: 'runCount',
    cell: ({ row }) => <span className="text-sm">{row.original.runCount}</span>,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Runs" />
    ),
  },
  {
    accessorKey: 'latestRunTimestamp',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatTimestamp(row.original.latestRunTimestamp)}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest Run" />
    ),
  },
  {
    accessorKey: 'latestDuration',
    cell: ({ row }) => (
      <span className="text-sm">
        {formatDuration(row.original.latestDuration)}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
  },
  {
    accessorKey: 'latestMeanScore',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.latestMeanScore.toFixed(3)}</span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mean Score" />
    ),
  },
  {
    accessorFn: (row) =>
      row.latestTotalCount > 0
        ? row.latestPassedCount / row.latestTotalCount
        : 0,
    cell: ({ row }) => {
      const { latestPassedCount, latestTotalCount } = row.original;
      return (
        <span className="text-sm">
          {latestPassedCount}/{latestTotalCount}
          {latestTotalCount > 0 && (
            <span className="text-muted-foreground ml-1">
              ({formatPassRate(latestPassedCount, latestTotalCount)})
            </span>
          )}
        </span>
      );
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pass Rate" />
    ),
    id: 'passRate',
  },
];

interface SuitesTableProps {
  suites: SuiteSummary[];
}

export function SuitesTable({ suites }: SuitesTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={suites}
      onRowClick={(row) =>
        router.push(`/suites/${row.slug}`)
      }
    />
  );
}
