import { openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { defineDataset } from 'viteval/dataset';
import { z } from 'zod';

export default defineDataset({
  data: async () => {
    const data = [];

    for (let i = 0; i < 10; i++) {
      const { output } = await generateText({
        model: openai('gpt-5'),
        prompt: 'Generate a science question and the expected answer',
        output: Output.object({
          schema: z.object({
            answer: z.string().describe('The answer to the science question'),
            question: z.string().describe('The science question to answer'),
          }),
        }),
        instructions: `
          You are an expert at generating test data for a science agent. You will generate a science question and the expected answer.
          Focus on questions about physics, chemistry, biology, earth sciences, and scientific concepts.
          `,
      });
      data.push({
        expected: output.answer,
        input: output.question,
      });
    }

    return data;
  },
  name: 'science',
});
