import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { DatasetSummary } from '@/types';
import type { FilterConfig } from '@/components/list-filter';
import { ListFilter } from '@/components/list-filter';
import { DatasetsTable } from '@/components/datasets-table';
import type { RemoteTableState } from '@/components/ui/data-table';

const filterConfig: FilterConfig = {
  search: { placeholder: 'Search by name...', type: 'text' },
};

interface DatasetsListProps {
  datasets: DatasetSummary[];
  remote?: RemoteTableState;
}

export function DatasetsList({ datasets, remote }: DatasetsListProps) {
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const searchParams = new URLSearchParams(searchStr);
  const search = searchParams.get('q') ?? '';

  const filtered = useMemo(() => {
    if (!search) {
      return datasets;
    }
    const q = search.toLowerCase();
    return datasets.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }, [datasets, search]);

  return (
    <div className="space-y-4">
      <ListFilter config={filterConfig} />
      <DatasetsTable datasets={remote ? datasets : filtered} remote={remote} />
    </div>
  );
}
