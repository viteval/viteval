import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Database,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { RunsChart } from '@/components/runs-chart';
import { Stat } from '@/components/stat';
import { formatDuration, formatPassRate, formatTimestamp } from '@/lib/utils';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export default async function DashboardPage() {
  const [resultsResponse, chartResponse, datasetsResponse] = await Promise.all([
    viteval.results.list({ limit: 5, page: 1 }),
    viteval.results.list({ limit: 20, page: 1 }),
    viteval.datasets.list({ limit: 5, page: 1 }),
  ]);

  const recentResults = resultsResponse.data;
  const chartResults = chartResponse.data;
  const recentDatasets = datasetsResponse.data;
  const totalResults = resultsResponse.total;
  const totalDatasets = datasetsResponse.total;

  const latest = recentResults[0]?.summary ?? null;
  const latestPassRate = latest
    ? formatPassRate(latest.numPassedEvals, latest.numTotalEvals)
    : 'N/A';
  const latestDuration =
    latest?.duration !== null && latest?.duration !== undefined
      ? formatDuration(latest.duration)
      : 'N/A';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        title="Dashboard"
        description="Overview of your evaluation results and datasets"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <Stat
              label="Results"
              value={totalResults}
              icon={<BarChart3 className="h-4 w-4" />}
              size="lg"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat
              label="Datasets"
              value={totalDatasets}
              icon={<Database className="h-4 w-4" />}
              size="lg"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat
              label="Pass Rate"
              value={latestPassRate}
              icon={<TrendingUp className="h-4 w-4" />}
              size="lg"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat
              label="Duration"
              value={latestDuration}
              icon={<Clock className="h-4 w-4" />}
              size="lg"
            />
          </CardContent>
        </Card>
      </div>

      <RunsChart results={chartResults} />

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
                  href={`/results/${r.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {r.name}
                    </span>
                    {r.summary?.startTime ? (
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(r.summary.startTime)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {r.summary?.status === 'running' ? (
                      <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500 animate-pulse"
                      >
                        Running
                      </Badge>
                    ) : (r.summary ? (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(r.summary.duration)}
                        </span>
                        <Badge
                          variant={
                            r.summary.success ? 'success' : 'destructive'
                          }
                        >
                          {r.summary.numPassedEvals}/{r.summary.numTotalEvals}
                        </Badge>
                      </>
                    ) : null)}
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
