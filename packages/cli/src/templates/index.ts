import fs from 'node:fs/promises';
import path from 'node:path';
import { createFile, fileExists, } from '@viteval/internal';

const TEMPLATES_DIR = import.meta.dirname;

export type TemplateName = 'viteval.config.ts' | 'viteval.setup.ts';

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
  if (!content) {
    return { status: 'error', error: new Error('Template not found') };
  }
  return await createFile(filePath, content);
}

/**
 * Read the contents of a template
 * @param template - The name of the template to read
 * @returns The contents of the template
 */
export async function readTemplateContents(
  template: TemplateName
): Promise<string | null> {
  const templatePath = path.join(TEMPLATES_DIR, `${template}.template`);
  const exists = await fileExists(templatePath);
  if (!exists) {
    return null;
  }

  return await fs.readFile(templatePath, 'utf-8');
}
