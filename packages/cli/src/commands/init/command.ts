import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createFile, fileExists } from '@viteval/internal';
import { command } from 'maltty';
import { attemptAsync, isErr, ok, unwrap } from 'massaman/control';
import { reduceAsync } from 'massaman/array';
import { match } from 'massaman/match';
import { INIT_ARGS } from '#/lib/command-options';
import { hasPackageJson } from '#/lib/utils';
import { createFileFromTemplate } from '#/templates';

export const initCommand = command({
  description: 'Initialize a new project',
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
    const manifest = await attemptAsync(async (): Promise<unknown> =>
      JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'))
    );
    if (!manifest.ok) {
      fail(`Failed to read package.json: ${manifest.error.message}`);
    }
    const isEsm =
      typeof manifest.value === 'object' &&
      manifest.value !== null &&
      'type' in manifest.value &&
      manifest.value.type === 'module';
    const configName = match(isEsm)
      .with(true, () => 'viteval.config.ts')
      .with(false, () => 'viteval.config.mts')
      .exhaustive();
    const hasConfig = await reduceAsync(
      ['ts', 'mts', 'js', 'mjs', 'cts', 'cjs'],
      async (found, extension) => {
        if (found) {
          return true;
        }
        const exists = await fileExists(
          path.join(cwd, `viteval.config.${extension}`)
        );
        if (!exists.ok) {
          fail(
            `Failed to inspect Viteval configuration: ${exists.error.message}`
          );
        }
        return exists.value === true;
      },
      false
    );

    logger.step('Initializing project...');

    const useEnv =
      args['env-file'] ??
      (await match(Boolean(process.stdin.isTTY))
        .with(true, () =>
          prompts.confirm({
            message: 'Do you want to use a .env file?',
            initialValue: true,
          })
        )
        .with(false, () => false)
        .exhaustive());

    const envFilePath = path.resolve(cwd, args['env-file-path']);
    const envReference = match(path.isAbsolute(args['env-file-path']))
      .with(true, () => pathToFileURL(envFilePath).href)
      .with(false, () =>
        path
          .relative(cwd, envFilePath)
          .split(path.sep)
          .map(encodeURIComponent)
          .join('/')
      )
      .exhaustive();

    await match(useEnv)
      .with(true, async () => {
        const result = await createFile(envFilePath, 'OPENAI_API_KEY=""\n');

        if (isErr(result)) {
          fail(`Failed to create .env file: ${result.error.message}`);
        }
        if (!result.value) {
          logger.info('.env file already exists, skipping...');
        }
      })
      .with(false, () => undefined)
      .exhaustive();

    const envContent = match(useEnv)
      .with(
        true,
        () =>
          `import { existsSync } from 'node:fs';\nimport { loadEnvFile } from 'node:process';\n\nconst envFile = new URL(${JSON.stringify(envReference)}, import.meta.url);\nif (existsSync(envFile)) {\n  loadEnvFile(envFile);\n}\n`
      )
      .with(false, () => '')
      .exhaustive();
    const { readTemplateContents } = await import('#/templates');
    const template = unwrap(await readTemplateContents('viteval.config.ts'));
    const configResult = await match(hasConfig)
      .with(true, () => ok(false))
      .with(false, () =>
        createFile(path.join(cwd, configName), `${envContent}${template}`)
      )
      .exhaustive();
    if (isErr(configResult)) {
      fail(`Failed to create ${configName}: ${configResult.error.message}`);
    }
    if (!configResult.value) {
      logger.note(
        'Keep your existing viteval.config file. Configure evaluation defaults under eval and storage integrations under providers.',
        'Existing Viteval configuration'
      );
    }

    const starter = await createFileFromTemplate(
      path.join(cwd, 'src', 'viteval.eval.ts'),
      'starter.eval.ts'
    );
    if (isErr(starter)) {
      fail(`Failed to create starter evaluation: ${starter.error.message}`);
    }

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
  options: {
    'env-file': {
      alias: 'create-env-file',
      description: 'Create .env file',
      type: 'boolean',
    },
    'env-file-path': {
      default: '.env',
      description: 'Path to .env file',
      type: 'string',
    },
  },
});
