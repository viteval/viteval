import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    color?: string;
    description?: string;
  };

  const result = await viteval.tags.update({
    color: body.color,
    description: body.description,
    id,
    name: body.name,
  });
  if ('error' in result) {
    const status = result.error.startsWith('Tag not found:') ? 404 : 500;
    return Response.json(result, { status });
  }

  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await viteval.tags.delete({ id });
  return 'error' in result
    ? Response.json(result, { status: 500 })
    : Response.json(result);
}
