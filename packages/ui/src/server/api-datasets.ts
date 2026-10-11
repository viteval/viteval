import { createViteval, parsePaginateParams } from '@/sdk';

export async function GET(request: Request) {
  const viteval = createViteval();
  const { searchParams } = new URL(request.url);
  const result = await viteval.datasets.list(parsePaginateParams(searchParams));
  return Response.json(result);
}
