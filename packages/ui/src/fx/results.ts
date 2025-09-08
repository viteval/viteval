import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { vitevalReader } from '../lib/viteval';

export const listResults = createServerFn({
  method: 'GET',
})
  .validator(
    z.object({ next: z.string().optional(), limit: z.number().optional() })
  )
  .handler(async (ctx) => {
    return await vitevalReader.listResults(ctx.data);
  });

export const getResult = createServerFn({
  method: 'GET',
})
  .validator(z.object({ id: z.string() }))
  .handler(async (ctx) => {
    const resultId = ctx.data.id;

    if (!resultId) {
      return null;
    }

    const results = await vitevalReader.readResult(resultId);

    if (!results) {
      return null;
    }

    return results;
  });
