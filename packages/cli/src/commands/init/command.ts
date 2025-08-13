import fs from 'node:fs/promises';
import path from 'node:path';
import type { CommandModule } from 'yargs';
import { createLogger } from '#/lib/logger';
import {
  createFile,
  fileExists,
  hasPackageJson,
  type SafeResultStatus,
} from '#/lib/utils';

export const initCommand: CommandModule<
  unknown,
  {
    envFile?: boolean;
    envFilePath?: string;
  }
> = {
  command: 'init',
  describe: 'Initialize a new project',
  builder: (yargs) => {
    return yargs
      .option('env-file', {
        type: 'boolean',
        describe: 'Create .env file',
      })
      .option('env-file-path', {
        type: 'string',
        describe: 'Path to .env file',
        default: '.env',
      });
  },
  handler: async (argv) => {
    const cwd = process.cwd().replace(/\\/g, '/');
    const logger = createLogger();

    const packageJson = await hasPackageJson(cwd);

    if (!packageJson) {
      logger.error(
        'Package.json does not exist in the current directory. Viteval needs to run in a project directory.'
      );
      return;
    }

    logger.start('Initializing project...');

    const useEnv =
      argv.envFile ??
      (await logger.prompt('Do you want to use .env file? (y/n)', {
        default: 'y',
      }));
    const envFilePath = argv.envFilePath ?? '.env';

    if (useEnv === 'y') {
      const result = await createFile(
        path.join(cwd, envFilePath),
        'OPENAI_API_KEY=""\n'
      );

      if (result.status === 'exists') {
        logger.info('.env file already exists, skipping...');
      }

      const setupResult = await createFileFromTemplate(
        path.join(cwd, 'viteval.setup.ts'),
        'viteval.setup.ts'
      );
      if (setupResult.status === 'exists') {
        logger.info('viteval.setup.ts file already exists, skipping...');
      }
    }

    const configResult = await createFileFromTemplate(
      path.join(cwd, 'viteval.config.ts'),
      'viteval.config.ts'
    );
    if (configResult.status === 'exists') {
      logger.info('viteval.config.ts file already exists, skipping...');
    }

    const dotDir = await createFile(path.join(cwd, '.viteval/.gitkeep'), '');
    if (dotDir.status === 'created') {
      logger.info('Created .viteval directory');
    }

    logger.success('Project initialized successfully');
  },
};

/*
|------------------
| Internals
|------------------
*/

async function createFileFromTemplate(
  filePath: string,
  template: string
): Promise<SafeResultStatus<'exists' | 'created' | 'error', null>> {
  const content = await readTemplateContents(template);
  if (!content) {
    return { status: 'error', error: new Error('Template not found') };
  }
  return await createFile(filePath, content);
}

async function readTemplateContents(template: string): Promise<string | null> {
  const exists = await fileExists(template);
  if (!exists) {
    return null;
  }

  return await fs.readFile(
    path.join(import.meta.dirname, 'templates', template),
    'utf-8'
  );
}
