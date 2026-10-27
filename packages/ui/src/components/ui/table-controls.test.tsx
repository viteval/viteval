// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from './data-table';
import { DataTableColumnHeader } from './data-table-column-header';

afterEach(cleanup);

describe('local table controls', () => {
  it('should sort in both directions and navigate first, previous, next and last pages', () => {
    render(
      <DataTable
        data={Array.from({ length: 25 }, (_, index) => ({
          name: String(index).padStart(2, '0'),
        }))}
        columns={[
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Name" />
            ),
          },
        ]}
      />
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Name' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Asc' }));
    expect(screen.getAllByRole('cell')[0].textContent).toBe('00');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Name' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Desc' }));
    expect(screen.getAllByRole('cell')[0].textContent).toBe('24');
    fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(screen.getByText('3 / 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('2 / 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'First page' }));
    expect(screen.getByText('1 / 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('should render unsortable and placeholder headers without making them sorting controls', () => {
    render(
      <DataTable
        data={[{ name: 'item', extra: 1 }]}
        columns={[
          { accessorKey: 'extra', header: 'Standalone', size: 50 },
          {
            id: 'group',
            header: 'Group',
            columns: [
              {
                accessorKey: 'name',
                enableSorting: false,
                header: ({ column }) => (
                  <DataTableColumnHeader column={column} title="Name" />
                ),
              },
            ],
          },
        ]}
      />
    );
    expect(screen.queryByRole('button', { name: 'Name' })).toBeNull();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(
      screen
        .getAllByRole('columnheader')
        .some((header) => header.textContent === '')
    ).toBe(true);
  });

  it('should activate rows with space, ignore unrelated keys and preserve non-element event targets', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={[{ name: 'item' }]}
        columns={[{ accessorKey: 'name' }]}
        onRowClick={onRowClick}
      />
    );
    const row = screen.getByRole('button', { name: 'item' });
    fireEvent.keyDown(row, { key: 'x' });
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.keyDown(row, { key: ' ' });
    expect(onRowClick).toHaveBeenCalledOnce();
    const text = screen.getByText('item').firstChild;
    if (!text) throw new Error('Missing cell text node');
    fireEvent(text, new MouseEvent('click', { bubbles: true }));
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
