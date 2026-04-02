"use client"

import { type Column } from "@tanstack/react-table"
import { Icon } from "@iconify/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("-ml-3 h-8", className)}>
          <span>{title}</span>
          {column.getIsSorted() === "desc" ? (
            <Icon icon="lucide:arrow-down" className="h-4 w-4" />
          ) : column.getIsSorted() === "asc" ? (
            <Icon icon="lucide:arrow-up" className="h-4 w-4" />
          ) : (
            <Icon icon="lucide:chevrons-up-down" className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <Icon icon="lucide:arrow-up" className="h-3.5 w-3.5" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <Icon icon="lucide:arrow-down" className="h-3.5 w-3.5" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DataTableColumnHeader }
