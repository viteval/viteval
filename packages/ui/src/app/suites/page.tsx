import { Suspense } from 'react';
import { FlaskConical } from 'lucide-react';
import { SuitesList } from '@/components/suites-list';
import { vitevalReader } from '@/lib/viteval';

export default async function SuitesPage() {
  const suites = await vitevalReader.listSuites();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-6 w-6" />
          Suites
        </h1>
        <p className="text-muted-foreground">
          All evaluation suites across runs
        </p>
      </div>
      <Suspense>
        <SuitesList suites={suites} />
      </Suspense>
    </div>
  );
}
