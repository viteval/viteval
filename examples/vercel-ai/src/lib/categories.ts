export const categories = [
  {
    description: 'Geography questions about countries, cities, and landmarks',
    name: 'geography',
  },
  {
    description: 'History questions about events, people, and places',
    name: 'history',
  },
  {
    description:
      'Science questions about physics, chemistry, biology, and other sciences',
    name: 'science',
  },
  {
    description:
      'Math questions about algebra, geometry, and other math topics',
    name: 'math',
  },
  {
    description: 'General questions about anything',
    name: 'general',
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
