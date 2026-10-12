interface SuiteIdentity {
  name: string;
  projectName?: string;
  filepath?: string;
}

/**
 * Identifies a suite without losing project, filename, case, or punctuation.
 * @param suite - The recorded suite identity.
 * @returns A raw route parameter; Router performs URL encoding.
 * @example suiteId({ name: 'accuracy', projectName: 'gpt-4' });
 */
export function suiteId(suite: SuiteIdentity): string {
  return `suite:${JSON.stringify([suite.name, suite.projectName ?? null, suite.filepath ?? ''])}`;
}
