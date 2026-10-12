/**
 * Display and index a suite without conflating Vitest project variants.
 * @param suite - Suite label and optional project name.
 * @returns Project-qualified display name.
 * @example suiteName({ name: 'accuracy', projectName: 'gpt' });
 */
export function suiteName(suite: {
  name: string;
  projectName?: string;
}): string {
  return suite.projectName
    ? `${suite.name} [${suite.projectName}]`
    : suite.name;
}
