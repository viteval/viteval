'use client';

import { useCallback } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  search?:
    | {
        type: 'text';
        placeholder?: string;
      }
    | {
        type: 'date-range';
      };
  statusOptions?: FilterOption[];
  statusLabel?: string;
  sortOptions?: FilterOption[];
}

interface ListFilterProps {
  config: FilterConfig;
}

export function ListFilter({ config }: ListFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const sort = searchParams.get('sort') ?? config.sortOptions?.[0]?.value ?? '';

  const hasFilters =
    search ||
    from ||
    to ||
    status !== 'all' ||
    sort !== (config.sortOptions?.[0]?.value ?? '');

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        !value ||
        value === 'all' ||
        value === config.sortOptions?.[0]?.value
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams, config.sortOptions]
  );

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {config.search?.type === 'text' && (
        <div className="relative w-full sm:min-w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={config.search.placeholder ?? 'Search...'}
            value={search}
            onChange={(e) => updateParams('q', e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      {config.search?.type === 'date-range' && (
        <div className="flex gap-2 items-center">
          <DateTimePicker
            value={fromDate}
            onChange={(d) => updateParams('from', d?.toISOString() ?? '')}
            placeholder="From"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <DateTimePicker
            value={toDate}
            onChange={(d) => updateParams('to', d?.toISOString() ?? '')}
            placeholder="To"
          />
        </div>
      )}
      {config.statusOptions && config.statusOptions.length > 0 && (
        <Select value={status} onValueChange={(v) => updateParams('status', v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={config.statusLabel ?? 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {config.statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {config.sortOptions && config.sortOptions.length > 0 && (
        <Select value={sort} onValueChange={(v) => updateParams('sort', v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {config.sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={resetFilters}
          title="Reset filters"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
