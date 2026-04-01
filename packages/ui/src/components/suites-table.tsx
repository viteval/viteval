'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { match } from 'ts-pattern';
import { formatDuration, formatTimestamp } from '@/lib/utils';
import type { SuiteSummary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const columns: ColumnDef<SuiteSummary>[] = [
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
    accessorKey: 'filepath',
    header: 'File',
    cell: ({ row }) =>
      row.original.filepath ? (
        <code className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
          {row.original.filepath}
        </code>
      ) : null,
    enableSorting: false,
  },
  {
    accessorKey: 'latestStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest Status" />
    ),
    cell: ({ row }) =>
      match(row.original.latestStatus)
        .with('passed', () => <Badge variant="default">Passed</Badge>)
        .with('failed', () => <Badge variant="destructive">Failed</Badge>)
        .with('running', () => (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600 animate-pulse"
          >
            Running
          </Badge>
        ))
        .otherwise((s) => <Badge variant="secondary">{s}</Badge>),
  },
  {
    accessorKey: 'runCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Runs" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.runCount}</span>
    ),
  },
  {
    accessorKey: 'latestRunTimestamp',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest Run" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatTimestamp(row.original.latestRunTimestamp)}
      </span>
    ),
  },
  {
    accessorKey: 'latestDuration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {formatDuration(row.original.latestDuration)}
      </span>
    ),
  },
  {
    accessorKey: 'latestMeanScore',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mean Score" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.latestMeanScore.toFixed(3)}
      </span>
    ),
  },
  {
    id: 'passRate',
    accessorFn: (row) =>
      row.latestTotalCount > 0
        ? row.latestPassedCount / row.latestTotalCount
        : 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pass Rate" />
    ),
    cell: ({ row }) => {
      const { latestPassedCount, latestTotalCount } = row.original;
      return (
        <span className="text-sm">
          {latestPassedCount}/{latestTotalCount}
          {latestTotalCount > 0 && (
            <span className="text-muted-foreground ml-1">
              ({((latestPassedCount / latestTotalCount) * 100).toFixed(0)}%)
            </span>
          )}
        </span>
      );
    },
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
      onRowClick={(row) => router.push(`/suites/${encodeURIComponent(row.name)}`)}
    />
  );
}
