'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { getStatusBadge } from '@/lib/badges';
import type { SuiteSummary } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Duration, FilePath, PassRate, ScoreBadge, Timestamp } from '@/components/display';

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
        <FilePath path={row.original.filepath} />
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
      <Timestamp value={row.original.latestRunTimestamp} />
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest Run" />
    ),
  },
  {
    accessorKey: 'latestDuration',
    cell: ({ row }) => (
      <Duration ms={row.original.latestDuration} />
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
  },
  {
    accessorKey: 'latestMeanScore',
    cell: ({ row }) => (
      <ScoreBadge score={row.original.latestMeanScore} />
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
    cell: ({ row }) => (
      <PassRate
        passed={row.original.latestPassedCount}
        total={row.original.latestTotalCount}
        showFraction
      />
    ),
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
