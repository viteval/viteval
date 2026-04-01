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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest Status" />
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
              ({((latestPassedCount / latestTotalCount) * 100).toFixed(0)}%)
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
        router.push(`/suites/${encodeURIComponent(row.name)}`)
      }
    />
  );
}
