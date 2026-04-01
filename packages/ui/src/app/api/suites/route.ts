import { vitevalReader } from '@/lib/viteval';

export async function GET() {
  const suites = await vitevalReader.listSuites();
  return Response.json(suites);
}
