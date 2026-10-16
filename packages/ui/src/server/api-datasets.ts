import { createViteval, parsePaginateParams } from '@/sdk';
import { datasetsSearchSchema } from './search';

export async function GET(request: Request) {
  const viteval = createViteval();
  const { searchParams } = new URL(request.url);
  const result = await viteval.datasets.list(
    datasetsSearchSchema.parse({
      ...Object.fromEntries(searchParams),
      ...parsePaginateParams(searchParams),
    })
  );
  return Response.json(result);
}
