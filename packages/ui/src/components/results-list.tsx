'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ResultFile } from '@/types';
import type { FilterConfig } from '@/components/list-filter';
import { ListFilter } from '@/components/list-filter';
import { ResultsTable } from '@/components/results-table';

const filterConfig: FilterConfig = {
  search: { type: 'date-range' },
  statusOptions: [
    { label: 'Passed', value: 'passed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Running', value: 'running' },
  ],
  statusLabel: 'Status',
};

interface ResultsListProps {
  results: ResultFile[];
}

export function ResultsList({ results }: ResultsListProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const status = searchParams.get('status') ?? 'all';

  const filtered = useMemo(() => {
    let items = results;

    if (from) {
      const fromMs = new Date(from).getTime();
      if (!Number.isNaN(fromMs)) {
        items = items.filter((r) => Number(r.timestamp) >= fromMs);
      }
    }

    if (to) {
      const toMs = new Date(to).getTime();
      if (!Number.isNaN(toMs)) {
        items = items.filter((r) => Number(r.timestamp) <= toMs);
      }
    }

    if (status !== 'all') {
      items = items.filter((r) => {
        if (!r.summary) return false;
        if (status === 'running') return r.summary.status === 'running';
        if (status === 'passed') return r.summary.success;
        if (status === 'failed') return !r.summary.success;
        return true;
      });
    }

    return items;
  }, [results, from, to, status]);

  return (
    <div className="space-y-4">
      <ListFilter config={filterConfig} />
      <ResultsTable results={filtered} />
    </div>
  );
}
