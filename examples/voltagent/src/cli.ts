import consola from 'consola';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { categories } from '#/lib/categories';
import generateAnswer from '#models/generate-answer';

dotenv.config();

(async () => {
  await yargs(hideBin(process.argv))
    .scriptName('question')
    .usage('$0 <command> [options]')
    .command([
      {
        command: 'answer',
        describe: 'Generate an answer to a question',
        handler: async () => {
          const category = await consola.prompt('What is the category?', {
            type: 'select',
            options: categories.map(({ name, description }) => ({
              label: name,
              value: name,
              hint: description,
            })),
            required: true,
          });
          const question = await consola.prompt('What is the question?', {
            type: 'text',
            placeholder: 'What is the capital of France?',
          });

          const answer = await generateAnswer(question, category);
          consola.success(answer);
        },
      },
    ])
    .demandCommand(1, 'You must specify a command')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .strict()
    .parseAsync();
})();
