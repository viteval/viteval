import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type Row,
  type RowData,
  type SortingState,
  type PaginationState,
  type Updater,
  flexRender,
  useTable,
} from "@tanstack/react-table"
import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { dataTableFeatures, type DataTableFeatures } from "@/components/ui/data-table-features"

export interface RemoteTableState {
  total: number
  pagination: PaginationState
  sorting: SortingState
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onSortingChange: (updater: Updater<SortingState>) => void
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  getRowCanExpand?: (row: Row<DataTableFeatures, TData>) => boolean
  renderExpandedRow?: (row: Row<DataTableFeatures, TData>) => React.ReactNode
  remote?: RemoteTableState
}

function DataTable<TData extends RowData>({
  columns,
  data,
  onRowClick,
  getRowCanExpand,
  renderExpandedRow,
  remote,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const table = useTable({
    data,
    columns,
    features: dataTableFeatures,
    getRowCanExpand,
    manualPagination: Boolean(remote),
    manualSorting: Boolean(remote),
    rowCount: remote?.total,
    ...(remote ? { onPaginationChange: remote.onPaginationChange } : {}),
    onSortingChange: remote?.onSortingChange ?? setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    state: {
      sorting: remote?.sorting ?? sorting,
      ...(remote ? { pagination: remote.pagination } : {}),
      columnFilters,
      expanded,
    },
  })

  return (
    <div className="space-y-4 min-w-0">
      <div className="overflow-x-auto rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={
                      header.getSize() !== 150
                        ? { width: header.getSize() }
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const interactive = Boolean(onRowClick) || row.getCanExpand()
                const activate = () => {
                  if (row.getCanExpand()) {
                    row.toggleExpanded()
                  } else {
                    onRowClick?.(row.original)
                  }
                }
                return (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={interactive ? "cursor-pointer" : ""}
                    tabIndex={interactive ? 0 : undefined}
                    role={interactive ? "button" : undefined}
                    onClick={
                      interactive
                        ? (event: React.MouseEvent<HTMLTableRowElement>) => {
                            const control = event.target instanceof Element
                              ? event.target.closest('a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="combobox"], [contenteditable="true"], [tabindex]')
                              : null
                            if (control && control !== event.currentTarget) return
                            activate()
                          }
                        : undefined
                    }
                    onKeyDown={
                      interactive
                        ? (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                            if (
                              e.target === e.currentTarget &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              activate()
                            }
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="overflow-hidden text-ellipsis whitespace-nowrap max-w-0"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderExpandedRow && (
                    <TableRow>
                      <TableCell
                        colSpan={table.getVisibleLeafColumns().length}
                        className="p-0"
                      >
                        {renderExpandedRow(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

export { DataTable }
