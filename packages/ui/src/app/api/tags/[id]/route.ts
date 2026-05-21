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

  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await viteval.tags.delete({ id });
  return Response.json({ data: null });
}
