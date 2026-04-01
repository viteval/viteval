import { vitevalReader } from '@/lib/viteval';

export async function GET() {
  const results = await vitevalReader.listResults();
  return Response.json(results);
}
