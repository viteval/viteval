'use client';

import Link from 'next/link';
import type { DatasetSummary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatasetsTableProps {
  datasets: DatasetSummary[];
}

export function DatasetsTable({ datasets }: DatasetsTableProps) {
  if (datasets.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              <span role="img" aria-label="chart">
                📊
              </span>
            </div>
            <div className="text-xl font-semibold mb-2">No Datasets Found</div>
            <div className="text-sm text-muted-foreground">
              No datasets were found in the .viteval/datasets directory.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {datasets.map((dataset) => (
        <Link
          key={dataset.id}
          href={`/datasets/${dataset.id}`}
          className="block"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate text-lg">{dataset.name}</span>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {dataset.itemCount} items
                </Badge>
              </CardTitle>
              <div>
                <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
                  {dataset.path}
                </code>
              </div>
            </CardHeader>
            <CardContent>
              {dataset.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {dataset.description}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
