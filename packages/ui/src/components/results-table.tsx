'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { match } from 'ts-pattern';
import { formatDuration, formatTimestamp } from '@/lib/utils';
import type { ResultFile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const columns: ColumnDef<ResultFile>[] = [
  {
    accessorFn: (row) => row.summary?.suiteNames?.join(', ') ?? '',
    cell: ({ row }) => {
      const names = row.original.summary?.suiteNames ?? [];
      if (names.length === 0)
        return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {names.map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: 'includesString',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Suites" />
    ),
    id: 'suites',
  },
  {
    accessorKey: 'timestamp',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <code className="text-xs text-muted-foreground">
          {row.original.timestamp}
        </code>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(row.original.timestamp)}
        </span>
      </div>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
  },
  {
    accessorFn: (row) => {
      if (row.summary?.status === 'running') return 'running';
      if (row.summary?.success) return 'passed';
      if (row.summary && !row.summary.success) return 'failed';
      return 'unknown';
    },
    cell: ({ row }) =>
      match(row.original.summary)
        .with({ status: 'running' }, () => (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600 animate-pulse"
          >
            Running
          </Badge>
        ))
        .with({ success: true }, () => <Badge variant="default">Passed</Badge>)
        .with({ success: false }, () => (
          <Badge variant="destructive">Failed</Badge>
        ))
        .otherwise(() => null),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    id: 'status',
  },
  {
    accessorFn: (row) => row.summary?.duration ?? 0,
    cell: ({ row }) => {
      const summary = row.original.summary;
      if (!summary) return null;
      if (summary.status === 'running' && !summary.duration) {
        return (
          <span className="text-sm text-muted-foreground">In progress...</span>
        );
      }
      return (
        <span className="text-sm">{formatDuration(summary.duration || 0)}</span>
      );
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
}

export function ResultsTable({ results }: ResultsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={results}
      onRowClick={(row) => router.push(`/results/${row.timestamp}`)}
    />
  );
}
