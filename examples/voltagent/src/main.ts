import { assertCategory, type Category } from '#/lib/categories';

export interface AnswerPayload {
  category: Category;
  question: string;
}

/**
 * Answer a question based on the category and question.
 * @param payload - The payload containing the category and question.
 * @returns The answer to the question.
 */
export function answer(payload: AnswerPayload) {
  assertCategory(payload.category);
}
