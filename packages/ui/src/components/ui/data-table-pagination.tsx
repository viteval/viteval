"use client"

import { type ReactTable, type RowData } from "@tanstack/react-table"
import { Icon } from "@iconify/react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DataTableFeatures } from "@/components/ui/data-table-features"

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>
}

function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s)
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select
            value={`${table.state.pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {table.getPageCount() === 0 ? 0 : table.state.pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <Icon icon="lucide:chevrons-left" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icon icon="lucide:chevron-left" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Icon icon="lucide:chevron-right" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <Icon icon="lucide:chevrons-right" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTablePagination }
