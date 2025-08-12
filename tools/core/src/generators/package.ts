import * as path from 'node:path';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  type Tree,
} from '@nx/devkit';
import type { PackageGeneratorSchema } from './schema';

export async function packageGenerator(
  tree: Tree,
  options: PackageGeneratorSchema
) {
  const projectRoot = `packages/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'package'),
    projectRoot,
    options
  );
  await formatFiles(tree);
}

export default packageGenerator;
