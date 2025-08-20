import { supervisorAgent } from '#/agents/supervisor';
import type { Category } from '#/lib/categories';
import { questionPrompt } from '#/lib/prompts';

/**
 * Generate an answer to a question.
 * @param prompt - The prompt to generate an answer for.
 * @returns The answer to the question.
 */
async function generateAnswer(category: Category, question: string) {
  const { text } = await supervisorAgent.generateText(
    questionPrompt(category, question)
  );
  return text;
}

export default generateAnswer;
