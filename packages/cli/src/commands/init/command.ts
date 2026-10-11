import path from 'node:path';
import { createFile } from '@viteval/internal';
import { command } from 'maltty';
import { isErr } from 'massaman/control';
import { INIT_ARGS } from '#/lib/command-options';
import { hasPackageJson } from '#/lib/utils';
import { createFileFromTemplate } from '#/templates';

export const initCommand = command({
  description: 'Initialize a new project',
  options: {
    'env-file': {
      description: 'Create .env file',
      type: 'boolean',
    },
    'env-file-path': {
      default: '.env',
      description: 'Path to .env file',
      type: 'string',
    },
  },
  handler: async ({ args: rawArgs, log: logger, prompts, fail }) => {
    const args = INIT_ARGS.parse(rawArgs);
    const cwd = process.cwd().replace(/\\/g, '/');

    const packageJson = await hasPackageJson(cwd);

    if (isErr(packageJson)) {
      fail(`Failed to inspect project: ${packageJson.error.message}`);
    }

    if (!packageJson.value) {
      fail(
        'Package.json does not exist in the current directory. Viteval needs to run in a project directory.'
      );
    }

    logger.step('Initializing project...');

    const useEnv =
      args['env-file'] ??
      (process.stdin.isTTY
        ? await prompts.confirm({
            message: 'Do you want to use a .env file?',
            initialValue: true,
          })
        : false);

    const envFilePath = args['env-file-path'];

    if (useEnv) {
      const result = await createFile(
        path.join(cwd, envFilePath),
        'OPENAI_API_KEY=""\n'
      );

      if (isErr(result)) {
        fail(`Failed to create .env file: ${result.error.message}`);
      }
      if (!result.value) {
        logger.info('.env file already exists, skipping...');
      }
    }

    const envContent = useEnv
      ? `import { existsSync } from 'node:fs';\nimport { loadEnvFile } from 'node:process';\n\nconst envFile = new URL(${JSON.stringify(envFilePath)}, import.meta.url);\nif (existsSync(envFile)) {\n  loadEnvFile(envFile);\n}\n`
      : '';
    const setupContent = `${envContent}import { fileURLToPath } from 'node:url';\nimport { createJsonProvider, initializeProvider } from 'viteval/provider';\n\nconst provider = createJsonProvider({ root: fileURLToPath(new URL('.', import.meta.url)) });\nconst initialized = await initializeProvider({ datasets: provider });\nif (!initialized.ok) throw initialized.error;\n`;
    const setupResult = await createFile(
      path.join(cwd, 'viteval.setup.ts'),
      setupContent
    );
    if (isErr(setupResult)) {
      fail(`Failed to create viteval.setup.ts: ${setupResult.error.message}`);
    }
    if (!setupResult.value) {
      logger.info('viteval.setup.ts file already exists, skipping...');
    }

    const configResult = await createFileFromTemplate(
      path.join(cwd, 'vitest.config.ts'),
      'vitest.config.ts'
    );
    if (isErr(configResult)) {
      fail(`Failed to create vitest.config.ts: ${configResult.error.message}`);
    }
    if (!configResult.value) {
      logger.note(
        'Include src/**/*.eval.ts, add viteval.setup.ts to setupFiles, and configure JsonReporter from viteval/reporters in your existing Vitest config.',
        'Existing Vitest configuration'
      );
    }

    const starter = await createFileFromTemplate(
      path.join(cwd, 'src', 'viteval.eval.ts'),
      'starter.eval.ts'
    );
    if (isErr(starter))
      fail(`Failed to create starter evaluation: ${starter.error.message}`);

    const dotDir = await createFile(path.join(cwd, '.viteval/.gitkeep'), '');
    if (isErr(dotDir)) {
      fail(`Failed to create .viteval: ${dotDir.error.message}`);
    }
    if (dotDir.value) {
      logger.info('Created .viteval directory');
    }

    logger.success('Project initialized successfully');
    logger.info(
      'Run your evaluation with viteval run. Inspect saved results with viteval ui.'
    );
  },
});
