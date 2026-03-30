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
        prompt: 'Generate a history question and the expected answer',
        schema: z.object({
          answer: z.string().describe('The answer to the history question'),
          question: z.string().describe('The history question to answer'),
        }),
        system: `
          You are an expert at generating test data for a history agent. You will generate a history question and the expected answer.
          Focus on questions about historical events, people, places, time periods, and cultural history.
          `,
      });
      data.push({
        expected: object.answer,
        input: object.question,
      });
    }

    return data;
  },
  name: 'history',
});
