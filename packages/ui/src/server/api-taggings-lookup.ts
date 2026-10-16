import { z } from 'zod';
import { createViteval } from '@/sdk';

const lookupTaggingsSchema = z.object({
  entityType: z.enum(['eval_run', 'eval_result', 'dataset', 'dataset_item']),
  entityIds: z.array(z.string()),
});

export async function POST(request: Request) {
  const viteval = createViteval();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }
  const parsed = lookupTaggingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'entityType and entityIds[] are required' },
      { status: 400 }
    );
  }

  const result = await viteval.tags.listTaggingsForEntities(
    parsed.data.entityType,
    parsed.data.entityIds
  );

  return Response.json(result);
}
