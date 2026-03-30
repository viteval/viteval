import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { defineDataset } from 'viteval/dataset';
import { z } from 'zod';

export default defineDataset({
  data: async () => {
    const data = [];

    for (let i = 0; i < 10; i++) {
      const { object } = await generateObject({
        model: openai('gpt-5'),
        prompt: 'Generate a science question and the expected answer',
        schema: z.object({
          answer: z.string().describe('The answer to the science question'),
          question: z.string().describe('The science question to answer'),
        }),
        system: `
          You are an expert at generating test data for a science agent. You will generate a science question and the expected answer.
          Focus on questions about physics, chemistry, biology, earth sciences, and scientific concepts.
          `,
      });
      data.push({
        expected: object.answer,
        input: object.question,
      });
    }

    return data;
  },
  name: 'science',
});
