'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useCallback } from 'react';
import type { DatasetFile, DatasetItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ValuePreview, ValueRenderer } from '@/components/value';

const columns: ColumnDef<DatasetItem>[] = [
  {
    cell: ({ row }) => {
      const hasDetails =
        row.original.input !== undefined ||
        row.original.expected !== undefined;
      if (!hasDetails) {return null;}
      return row.getIsExpanded() ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      );
    },
    enableSorting: false,
    header: '',
    id: 'expand',
    size: 32,
  },
  {
    accessorFn: (row) => row.name || row.id,
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.name || row.original.id}
      </span>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    id: 'name',
  },
  {
    accessorFn: () => '',
    cell: ({ row }) =>
      row.original.input !== undefined ? (
        <ValuePreview value={row.original.input} maxLength={50} />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    enableSorting: false,
    header: 'Input',
    id: 'input',
  },
  {
    accessorFn: () => '',
    cell: ({ row }) =>
      row.original.expected !== undefined ? (
        <ValuePreview value={row.original.expected} maxLength={50} />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    enableSorting: false,
    header: 'Expected',
    id: 'expected',
  },
  {
    accessorFn: (row) =>
      row.metadata ? Object.keys(row.metadata).length : 0,
    cell: ({ row }) => {
      const {metadata} = row.original;
      if (!metadata || Object.keys(metadata).length === 0) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      const keys = Object.keys(metadata);
      return (
        <div className="flex gap-1 flex-wrap">
          {keys.slice(0, 3).map((key) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key}
            </Badge>
          ))}
          {keys.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{keys.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
    header: 'Metadata',
    id: 'metadata',
  },
];

function ExpandedRow({ row }: { row: Row<DatasetItem> }) {
  const item = row.original;
  return (
    <div className="bg-muted/30 p-4 space-y-4 overflow-hidden">
      {item.input !== undefined && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Input:</h4>
          <ValueRenderer value={item.input} label="Input" />
        </div>
      )}
      {item.expected !== undefined && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Expected:</h4>
          <ValueRenderer value={item.expected} label="Expected" />
        </div>
      )}
      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Metadata:</h4>
          <ValueRenderer value={item.metadata} label="Metadata" />
        </div>
      )}
    </div>
  );
}

interface DatasetDetailProps {
  dataset: DatasetFile;
}

export default function DatasetDetail({ dataset }: DatasetDetailProps) {
  const renderExpandedRow = useCallback(
    (row: Row<DatasetItem>) => <ExpandedRow row={row} />,
    []
  );

  return (
    <DataTable
      columns={columns}
      data={dataset.data}
      getRowCanExpand={(row) =>
        row.original.input !== undefined ||
        row.original.expected !== undefined
      }
      renderExpandedRow={renderExpandedRow}
    />
  );
}
