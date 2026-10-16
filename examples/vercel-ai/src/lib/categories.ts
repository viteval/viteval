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
 * Check whether a category is valid.
 * @param category - The category to check.
 * @returns Whether the value is a category.
 */
export function isCategory(category: unknown): category is Category {
  return categories.some((candidate) => candidate.name === category);
}
