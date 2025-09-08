import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { vitevalReader } from '../lib/viteval';

export const getDatasets = createServerFn({
  method: 'GET',
})
  .validator(
    z.object({ afterId: z.string().optional(), limit: z.number().optional() })
  )
  .handler(async (ctx) => {
    return await vitevalReader.listDatasets(ctx.data);
  });

export const getDataset = createServerFn({
  method: 'GET',
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const dataset = await vitevalReader.readDataset(data.id);

    if (!dataset) {
      throw new Error('Dataset not found');
    }

    return dataset;
  });
