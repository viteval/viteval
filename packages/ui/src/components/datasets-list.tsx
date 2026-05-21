'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DatasetSummary } from '@/types';
import type { FilterConfig } from '@/components/list-filter';
import { ListFilter } from '@/components/list-filter';
import { DatasetsTable } from '@/components/datasets-table';

const filterConfig: FilterConfig = {
  search: { placeholder: 'Search by name...', type: 'text' },
};

interface DatasetsListProps {
  datasets: DatasetSummary[];
}

export function DatasetsList({ datasets }: DatasetsListProps) {
  const searchParams = useSearchParams();
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
      <DatasetsTable datasets={filtered} />
    </div>
  );
}
