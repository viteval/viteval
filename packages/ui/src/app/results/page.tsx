import { BarChart3 } from 'lucide-react';
import { ResultsTable } from '@/components/results-table';
import { vitevalReader } from '@/lib/viteval';

export default async function ResultsPage() {
  const results = await vitevalReader.listResults();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Results
        </h1>
        <p className="text-muted-foreground">
          View and analyze your evaluation results
        </p>
      </div>
      <ResultsTable results={results} />
    </div>
  );
}
