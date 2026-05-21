import { createViteval, parsePaginateParams } from '@/sdk';

const viteval = createViteval();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await viteval.datasets.list(parsePaginateParams(searchParams));
  return Response.json(result);
}
