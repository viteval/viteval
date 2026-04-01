import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Database,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RunsChart } from '@/components/runs-chart';
import { formatDuration, formatTimestamp } from '@/lib/utils';
import { vitevalReader } from '@/lib/viteval';

export default async function DashboardPage() {
  const [results, datasets] = await Promise.all([
    vitevalReader.listResults(),
    vitevalReader.listDatasets(),
  ]);

  const latest = results[0]?.summary ?? null;
  const latestPassRate =
    latest && latest.numTotalEvals > 0
      ? `${((latest.numPassedEvals / latest.numTotalEvals) * 100).toFixed(1)}%`
      : 'N/A';
  const latestDuration =
    latest?.duration !== null && latest?.duration !== undefined
      ? formatDuration(latest.duration)
      : 'N/A';

  const recentResults = results.slice(0, 5);
  const recentDatasets = datasets.slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your evaluation results and datasets
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestPassRate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestDuration}</div>
          </CardContent>
        </Card>
      </div>

      <RunsChart results={results} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Latest Results
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/results" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No results yet
              </p>
            ) : (
              recentResults.map((r) => (
                <Link
                  key={r.id}
                  href={`/results/${r.timestamp}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {r.timestamp}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(r.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {r.summary?.status === 'running' ? (
                      <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500 animate-pulse"
                      >
                        Running
                      </Badge>
                    ) : r.summary ? (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(r.summary.duration)}
                        </span>
                        <Badge
                          variant={
                            r.summary.success ? 'default' : 'destructive'
                          }
                        >
                          {r.summary.numPassedEvals}/{r.summary.numTotalEvals}
                        </Badge>
                      </>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Latest Datasets
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/datasets" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentDatasets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No datasets yet
              </p>
            ) : (
              recentDatasets.map((d) => (
                <Link
                  key={d.id}
                  href={`/datasets/${d.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {d.name}
                    </span>
                    {d.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {d.description}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 ml-2">
                    {d.itemCount} items
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
