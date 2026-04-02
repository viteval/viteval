'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';
import { getStatusBadge } from '@/lib/badges';
import { formatDuration, formatPassRate, slugify } from '@/lib/utils';
import type { EvalResult, EvalResults, EvalSuite, Score } from '@/types';
import ScoresRenderer from './ScoresRenderer';
import { StatRow } from './stat-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ValuePreview, ValueRenderer } from '@/components/value';

const evalColumns: ColumnDef<EvalResult>[] = [
  {
    cell: ({ row }) => {
      if (!row.getCanExpand()) {return null;}
      return row.getIsExpanded() ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      );
    },
    enableSorting: false,
    header: '',
    id: 'expand',
    size: 32,
  },
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
    accessorFn: () => '',
    cell: ({ row }) =>
      row.original.output !== undefined ? (
        <ValuePreview value={row.original.output} maxLength={40} />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    enableSorting: false,
    header: 'Output',
    id: 'output',
  },
  {
    accessorKey: 'mean',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.mean.toFixed(3)}</span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mean" />
    ),
  },
  {
    accessorKey: 'threshold',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.threshold}</span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Threshold" />
    ),
  },
  {
    accessorFn: (row) => (row.mean >= row.threshold ? 'passed' : 'failed'),
    cell: ({ row }) => {
      const passed = row.original.mean >= row.original.threshold;
      return (
        <Badge variant={passed ? 'success' : 'destructive'}>
          {passed ? 'Passed' : 'Failed'}
        </Badge>
      );
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Result" />
    ),
    id: 'result',
  },
  {
    accessorFn: (row) => row.scores.length,
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.scores.map((score: Score, i) => (
          <Badge
            key={`${score.name}-${i}`}
            variant="outline"
            className="text-xs"
          >
            {score.name}: {score.score}
          </Badge>
        ))}
      </div>
    ),
    enableSorting: false,
    header: 'Scores',
    id: 'scores',
  },
];

function ExpandedEvalRow({ row }: { row: Row<EvalResult> }) {
  const evalResult = row.original;
  return (
    <div className="bg-muted/30 p-4 space-y-4 overflow-hidden">
      {evalResult.input !== undefined && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Input:</h4>
          <ValueRenderer value={evalResult.input} label="Input" />
        </div>
      )}
      {evalResult.expected !== undefined && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Expected:</h4>
          <ValueRenderer value={evalResult.expected} label="Expected" />
        </div>
      )}
      {evalResult.output !== undefined && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Output:</h4>
          <ValueRenderer value={evalResult.output} label="Output" />
        </div>
      )}
      {evalResult.metadata &&
        Object.keys(evalResult.metadata).length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Metadata:</h4>
            <ValueRenderer value={evalResult.metadata} label="Metadata" />
          </div>
        )}
      {evalResult.scores.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Scores:</h4>
          <ScoresRenderer scores={evalResult.scores} />
        </div>
      )}
    </div>
  );
}

function SuiteSection({ suite }: { suite: EvalSuite }) {
  const renderExpandedRow = useCallback(
    (row: Row<EvalResult>) => <ExpandedEvalRow row={row} />,
    []
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{suite.name}</h2>
        <div className="flex items-center gap-2">
          {getStatusBadge(suite.status)}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/suites/${slugify(suite.name)}`}>View Eval</Link>
          </Button>
        </div>
      </div>
      <StatRow
        items={[
          {
            icon: <CheckCircle className="h-3.5 w-3.5" />,
            label: 'Passed',
            value: (
              <span className="text-green-600">
                {suite.summary.passedCount}
              </span>
            ),
          },
          {
            icon: <XCircle className="h-3.5 w-3.5" />,
            label: 'Failed',
            value: (
              <span className="text-red-600">
                {suite.summary.totalCount - suite.summary.passedCount}
              </span>
            ),
          },
          {
            icon: <Hash className="h-3.5 w-3.5" />,
            label: 'Total',
            value: suite.summary.totalCount,
          },
          {
            icon: <Target className="h-3.5 w-3.5" />,
            label: 'Mean Score',
            value: suite.summary.meanScore.toFixed(3),
          },
          {
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            label: 'Pass Rate',
            value: formatPassRate(
              suite.summary.passedCount,
              suite.summary.totalCount
            ),
          },
          {
            icon: <Clock className="h-3.5 w-3.5" />,
            label: 'Duration',
            value: formatDuration(suite.duration),
          },
        ]}
      />
      <h3 className="text-sm font-medium">Results</h3>
      <DataTable
        columns={evalColumns}
        data={suite.evalResults}
        getRowCanExpand={(row) =>
          row.original.input !== undefined ||
          row.original.expected !== undefined ||
          row.original.output !== undefined
        }
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}

interface ResultsDetailProps {
  results: EvalResults;
  error?: string | null;
}

export default function ResultsDetail({ results }: ResultsDetailProps) {
  return (
    <div className="space-y-8">
      {results.evalResults.map((suite: EvalSuite) => (
        <SuiteSection key={suite.name} suite={suite} />
      ))}
    </div>
  );
}
