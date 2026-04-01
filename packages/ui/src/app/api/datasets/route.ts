import { vitevalReader } from '@/lib/viteval';

export async function GET() {
  const datasets = await vitevalReader.listDatasets();
  return Response.json(datasets);
}
