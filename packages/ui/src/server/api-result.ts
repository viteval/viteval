import { createViteval } from '@/sdk';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viteval = createViteval();
  const { id } = params;
  const result = await viteval.results.get({ id });
  if ('error' in result)
    return Response.json({ error: result.error }, { status: 500 });
  const { data } = result;

  if (!data) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(data);
}
