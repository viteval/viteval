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
        prompt: 'Generate a general knowledge question and the expected answer',
        output: Output.object({
          schema: z.object({
            answer: z.string().describe('The answer to the question'),
            question: z.string().describe('The question to answer'),
          }),
        }),
        instructions: `
          You are an expert at generating test data for a general knowledge agent. You will generate a general knowledge question and the expected answer.
          `,
      });
      data.push({
        expected: output.answer,
        input: output.question,
      });
    }

    return data;
  },
  name: 'general',
});
