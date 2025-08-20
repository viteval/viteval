import { type Category, getCategoryDescription } from './categories';

/**
 * Create a prompt for a question.
 * @param category - The category of the question.
 * @param question - The question to answer.
 * @returns The prompt for the question.
 */
export function questionPrompt(category: Category, question: string) {
  return `
  Please answer the question based on the category.

  ## Category

  <category>
    <name>
    ${category}
    </name>
    <description>
    ${getCategoryDescription(category)}
    </description>
  </category>

  ## Question

  <question>
  ${question}
  </question>
  `;
}
