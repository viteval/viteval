import { vitevalReader } from '@/lib/viteval';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await vitevalReader.readResult(id);

  if (!result) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(result);
}
