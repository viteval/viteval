'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { getStatusBadge, getSuccessBadge } from '@/lib/badges';
import type { ResultFile } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Duration, Timestamp } from '@/components/display';

const allColumns: ColumnDef<ResultFile>[] = [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium truncate">{row.original.name}</span>
        {row.original.summary?.startTime ? (
          <Timestamp value={row.original.summary.startTime} />
        ) : null}
      </div>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Run" />
    ),
  },
  {
    accessorFn: (row) => {
      if (row.summary?.status === 'running') {return 'running';}
      if (row.summary?.success) {return 'passed';}
      if (row.summary && !row.summary.success) {return 'failed';}
      return 'unknown';
    },
    cell: ({ row }) => {
      const {summary} = row.original;
      if (!summary) {return null;}
      if (summary.status === 'running') {return getStatusBadge('running');}
      return getSuccessBadge(summary.success);
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    id: 'status',
  },
  {
    accessorFn: (row) => row.summary?.duration ?? 0,
    cell: ({ row }) => {
      const {summary} = row.original;
      if (!summary) {return null;}
      if (summary.status === 'running' && !summary.duration) {
        return (
          <span className="text-sm text-muted-foreground">In progress...</span>
        );
      }
      return <Duration ms={summary.duration || 0} />;
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    id: 'duration',
  },
  {
    accessorFn: (row) => row.summary?.numPassedEvals ?? 0,
    cell: ({ row }) => (
      <span className="text-sm text-green-600">
        {row.original.summary?.numPassedEvals ?? '-'}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Passed" />
    ),
    id: 'passed',
  },
  {
    accessorFn: (row) => row.summary?.numFailedEvals ?? 0,
    cell: ({ row }) => (
      <span className="text-sm text-red-600">
        {row.original.summary?.numFailedEvals ?? '-'}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Failed" />
    ),
    id: 'failed',
  },
  {
    accessorFn: (row) => row.summary?.numTotalEvals ?? 0,
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.summary?.numTotalEvals ?? '-'}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    id: 'total',
  },
];

interface ResultsTableProps {
  results: ResultFile[];
  hiddenColumnIds?: string[];
}

export function ResultsTable({
  results,
  hiddenColumnIds,
}: ResultsTableProps) {
  const router = useRouter();

  const columns = hiddenColumnIds
    ? allColumns.filter((c) => {
        const id = 'id' in c ? c.id : ('accessorKey' in c ? String(c.accessorKey) : undefined);
        return !id || !hiddenColumnIds.includes(id);
      })
    : allColumns;

  return (
    <DataTable
      columns={columns}
      data={results}
      onRowClick={(row) => router.push(`/results/${row.id}`)}
    />
  );
}
