import * as path from 'node:path';
import {
  type Tree,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
} from '@nx/devkit';
import type { ExampleGeneratorSchema } from './schema';

export async function exampleGenerator(
  tree: Tree,
  options: ExampleGeneratorSchema
) {
  const projectRoot = `examples/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    projectType: 'library',
    root: projectRoot,
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'example'),
    projectRoot,
    options
  );
  await formatFiles(tree);
}

export default exampleGenerator;
