import * as path from 'node:path';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  type Tree,
} from '@nx/devkit';
import type { ExampleGeneratorSchema } from './schema';

export async function exampleGenerator(
  tree: Tree,
  options: ExampleGeneratorSchema
) {
  const projectRoot = `examples/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'library',
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
