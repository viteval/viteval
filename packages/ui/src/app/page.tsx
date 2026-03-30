import Link from 'next/link';
import { BarChart3, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SectionCards } from '@/components/section-cards';
import { vitevalReader } from '@/lib/viteval';

export default async function DashboardPage() {
  const [results, datasets] = await Promise.all([
    vitevalReader.listResults(),
    vitevalReader.listDatasets(),
  ]);

  const latest = results[0]?.summary ?? null;
  const latestPassRate =
    latest && latest.numTotalEvals > 0
      ? latest.numPassedEvals / latest.numTotalEvals
      : null;
  const latestDuration = latest?.duration ?? null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your evaluation results and datasets
        </p>
      </div>

      <SectionCards
        totalResults={results.length}
        totalDatasets={datasets.length}
        latestPassRate={latestPassRate}
        latestDuration={latestDuration}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="h-5 w-5" />
              Results
            </CardTitle>
            <CardDescription>
              View and analyze your evaluation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/results">View Results</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-5 w-5" />
              Datasets
            </CardTitle>
            <CardDescription>Manage and explore your datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/datasets">View Datasets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
