export const categories = [
  {
    name: 'geography',
    description: 'Geography questions about countries, cities, and landmarks',
  },
  {
    name: 'history',
    description: 'History questions about events, people, and places',
  },
  {
    name: 'science',
    description:
      'Science questions about physics, chemistry, biology, and other sciences',
  },
  {
    name: 'math',
    description:
      'Math questions about algebra, geometry, and other math topics',
  },
  {
    name: 'general',
    description: 'General questions about anything',
  },
];

export type Category = (typeof categories)[number]['name'];

/**
 * Get the description of a category.
 * @param category - The category to get the description of.
 * @returns The description of the category.
 */
export function getCategoryDescription(category: Category) {
  return categories.find((c) => c.name === category)?.description;
}

/**
 * Assert that a category is valid.
 * @param category - The category to assert.
 */
export function assertCategory(
  category: unknown
): asserts category is Category {
  if (!categories.some((c) => c.name === category)) {
    throw new Error(`Invalid category: ${category}`);
  }
}
