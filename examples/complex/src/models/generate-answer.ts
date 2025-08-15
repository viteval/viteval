import { generateText } from 'ai';
import type { Category } from '#/lib/categories';
import { openai } from '#/lib/client';
import { questionPrompt } from '#/lib/prompts';

/**
 * Generate an answer to a question.
 * @param prompt - The prompt to generate an answer for.
 * @returns The answer to the question.
 */
async function generateAnswer(category: Category, question: string) {
  const { text } = await generateText({
    model: openai('gpt-5'),
    system: `
    You are a helpful assistant that can answer questions and help with tasks.
    You are given a prompt and you need to generate an answer.
    `,
    prompt: questionPrompt(category, question),
  });

  return text;
}

export default generateAnswer;
