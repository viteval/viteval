import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await viteval.results.get({ id });

  if (!data) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(data);
}
