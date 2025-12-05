import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { vitevalReader } from '../lib/viteval';

export const listResults = createServerFn({
  method: 'GET',
})
  .handler(async () => {
    return await vitevalReader.listResults();
  });

export const getResult = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({ id: z.string() }))
  .handler(async (ctx: { data: { id: string } }) => {
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
