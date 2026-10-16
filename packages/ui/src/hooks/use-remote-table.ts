import { useLocation, useNavigate } from '@tanstack/react-router';
import type {
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table';
import type { VitevalListResponse } from '@/sdk/types';
import type { RemoteTableState } from '@/components/ui/data-table';

/**
 * Connects table controls to the route that loads a server page.
 * @param response - Server pagination metadata for the displayed rows.
 * @returns Controlled pagination and sorting callbacks.
 * @example const remote = useRemoteTable(resultsResponse);
 */
export function useRemoteTable(
  response: Pick<VitevalListResponse<unknown>, 'total' | 'page' | 'limit'>
): RemoteTableState {
  const { pathname, searchStr } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(searchStr);
  const sort = params.get('sort');
  const sorting: SortingState = sort
    ? [{ id: sort, desc: params.get('order') === 'desc' }]
    : [];
  const pagination: PaginationState = {
    pageIndex: response.page - 1,
    pageSize: response.limit,
  };

  function updateQuery(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchStr);
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    void navigate({ href: `${pathname}?${next}`, resetScroll: false });
  }

  return {
    total: response.total,
    pagination,
    sorting,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      updateQuery({
        page: String(
          next.pageSize === pagination.pageSize ? next.pageIndex + 1 : 1
        ),
        limit: String(next.pageSize),
      });
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      updateQuery({
        page: '1',
        sort: next[0]?.id,
        order: next[0] ? (next[0].desc ? 'desc' : 'asc') : undefined,
      });
    },
  };
}
