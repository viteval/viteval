import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { vitevalReader } from '../lib/viteval';

export const getDatasets = createServerFn({
  method: 'GET',
})
  .handler(async () => {
    return await vitevalReader.listDatasets();
  });

export const getDataset = createServerFn({
  method: 'GET',
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const dataset = await vitevalReader.readDataset(data.id);

    if (!dataset) {
      return null;
    }

    return dataset;
  });
