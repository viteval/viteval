import { findUp } from 'find-up';

/**
 * Find the viteval config file in the current working directory or a given root.
 *
 * @param root - The root directory to search for the config file.
 * @returns The path to the config file.
 */
export function findConfigFile(root: string) {
  return findUp(
    ['ts', 'js', 'mts', 'mjs'].map((ext) => `viteval.config.${ext}`),
    {
      cwd: root,
    }
  );
}
