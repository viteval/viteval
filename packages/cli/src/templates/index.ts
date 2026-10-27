import { createFile } from '@viteval/internal';
import { err, isErr, ok, type Result } from 'massaman/control';

const TEMPLATES = {
  'viteval.config.ts': `import { defineConfig } from 'viteval/config';
import { createJsonProvider } from 'viteval';

export default defineConfig({
  eval: {
    timeout: 60_000,
    include: ['src/**/*.eval.ts'],
    results: ['json'],
  },
  dataset: { providers: ['json'] },
  providers: [createJsonProvider({ root: import.meta.dirname })],
});
`,
  'starter.eval.ts': `import { evaluate, scorers } from 'viteval';

evaluate('Uppercase', {
  data: [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
  ],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
`,
} as const;

export type TemplateName = keyof typeof TEMPLATES;

/**
 * Create a file from a template
 * @param filePath - The path to the file to create
 * @param template - The name of the template to use
 * @returns A SafeResultStatus
 */
export async function createFileFromTemplate(
  filePath: string,
  template: TemplateName
) {
  const content = await readTemplateContents(template);
  if (isErr(content)) {
    return content;
  }
  if (content.value === null) {
    return err('Template not found');
  }
  return await createFile(filePath, content.value);
}

/**
 * Read the contents of a template
 * @param template - The name of the template to read
 * @returns The contents of the template
 */
export async function readTemplateContents(
  template: TemplateName
): Promise<Result<string | null>> {
  return ok(TEMPLATES[template]);
}
