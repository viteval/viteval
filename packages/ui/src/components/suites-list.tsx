import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { SuiteSummary } from '@/types';
import type { FilterConfig } from '@/components/list-filter';
import { ListFilter } from '@/components/list-filter';
import { SuitesTable } from '@/components/suites-table';
import type { RemoteTableState } from '@/components/ui/data-table';

const filterConfig: FilterConfig = {
  search: { placeholder: 'Search by name or file...', type: 'text' },
  statusLabel: 'Status',
  statusOptions: [
    { label: 'Passed', value: 'passed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Running', value: 'running' },
  ],
};

interface SuitesListProps {
  suites: SuiteSummary[];
  remote?: RemoteTableState;
}

export function SuitesList({ suites, remote }: SuitesListProps) {
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const searchParams = new URLSearchParams(searchStr);
  const search = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';

  const filtered = useMemo(() => {
    let items = suites;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.filepath?.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      items = items.filter((s) => s.latestStatus === status);
    }

    return items;
  }, [suites, search, status]);

  return (
    <div className="space-y-4">
      <ListFilter config={filterConfig} />
      <SuitesTable suites={remote ? suites : filtered} remote={remote} />
    </div>
  );
}
