import type { PlopTypes } from '@turbo/gen';

const PACKAGE_TEMPLATES = 'tools/core/src/generators/files/package';
const EXAMPLE_TEMPLATES = 'tools/core/src/generators/files/example';

const prompts: PlopTypes.PromptQuestion[] = [
  {
    message: 'What name would you like to use?',
    name: 'name',
    type: 'input',
  },
  {
    message: 'What description would you like to use?',
    name: 'description',
    type: 'input',
  },
];

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('package', {
    actions: [
      {
        base: PACKAGE_TEMPLATES,
        destination: 'packages/{{name}}',
        templateFiles: [
          `${PACKAGE_TEMPLATES}/**/*`,
          `!${PACKAGE_TEMPLATES}/*.template`,
        ],
        type: 'addMany',
      },
      {
        path: 'packages/{{name}}/package.json',
        templateFile: `${PACKAGE_TEMPLATES}/package.json.template`,
        type: 'add',
      },
      {
        path: 'packages/{{name}}/README.md',
        templateFile: `${PACKAGE_TEMPLATES}/README.md.template`,
        type: 'add',
      },
      {
        path: 'packages/{{name}}/biome.json',
        templateFile: `${PACKAGE_TEMPLATES}/biome.json.template`,
        type: 'add',
      },
    ],
    description: 'Generate a Viteval package',
    prompts,
  });

  plop.setGenerator('example', {
    actions: [
      {
        base: EXAMPLE_TEMPLATES,
        destination: 'examples/{{name}}',
        templateFiles: [
          `${EXAMPLE_TEMPLATES}/**/*`,
          `!${EXAMPLE_TEMPLATES}/*.template`,
          `!${EXAMPLE_TEMPLATES}/.env.example`,
        ],
        type: 'addMany',
      },
      {
        path: 'examples/{{name}}/package.json',
        templateFile: `${EXAMPLE_TEMPLATES}/package.json.template`,
        type: 'add',
      },
      {
        path: 'examples/{{name}}/README.md',
        templateFile: `${EXAMPLE_TEMPLATES}/README.md.template`,
        type: 'add',
      },
      {
        path: 'examples/{{name}}/.env.example',
        templateFile: `${EXAMPLE_TEMPLATES}/.env.example`,
        type: 'add',
      },
    ],
    description: 'Generate a Viteval example',
    prompts,
  });
}
