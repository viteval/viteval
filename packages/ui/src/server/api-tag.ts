import { createViteval } from '@/sdk';
import { z } from 'zod';

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const viteval = createViteval();
  const { id } = params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }
  const parsed = updateTagSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: parsed.error.message }, { status: 400 });

  const result = await viteval.tags.update({
    ...parsed.data,
    id,
  });
  if ('error' in result) {
    const status = result.error.startsWith('Tag not found:') ? 404 : 500;
    return Response.json(result, { status });
  }

  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viteval = createViteval();
  const { id } = params;
  const result = await viteval.tags.delete({ id });
  return 'error' in result
    ? Response.json(result, { status: 500 })
    : Response.json(result);
}
