// @vitest-environment jsdom
import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableFeatures } from '@/components/ui/data-table-features';

afterEach(cleanup);

describe('DataTable', () => {
  it('should preserve nested controls while activating plain cells and focused rows', () => {
    const onRowClick = vi.fn();
    const onAction = vi.fn();
    render(<DataTable data={[{ name: 'item' }]} columns={[
      { accessorKey: 'name', header: 'Name' },
      { id: 'action', cell: () => <button onClick={onAction}>Cell action</button> },
    ]} onRowClick={onRowClick} />);
    const button = screen.getByRole('button', { name: 'Cell action' });
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
    const keydown = createEvent.keyDown(button, { key: ' ', bubbles: true, cancelable: true });
    fireEvent(button, keydown);
    expect(keydown.defaultPrevented).toBe(false);
    expect(onRowClick).not.toHaveBeenCalled();
    const cell = screen.getByText('item');
    fireEvent.click(cell);
    expect(onRowClick).toHaveBeenCalledOnce();
    fireEvent.keyDown(cell.closest('tr')!, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('should span the leaf columns for empty and expanded grouped rows', () => {
    const columns: ColumnDef<DataTableFeatures, { name: string; extra: string }, unknown>[] = [{
      id: 'group', header: 'Group', columns: [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'extra', header: 'Extra' },
      ],
    }];
    const view = render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No results.').getAttribute('colspan')).toBe('2');
    view.rerender(<DataTable columns={columns} data={[{ name: 'item', extra: 'extra' }]} getRowCanExpand={() => true} renderExpandedRow={() => 'Expanded content'} />);
    fireEvent.click(screen.getByText('item'));
    expect(screen.getByText('Expanded content').getAttribute('colspan')).toBe('2');
  });
});
