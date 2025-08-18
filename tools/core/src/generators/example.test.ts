import { readProjectConfiguration, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { exampleGenerator } from './example';
import type { ExampleGeneratorSchema } from './schema';

describe('package generator', () => {
  let tree: Tree;
  const options: ExampleGeneratorSchema = {
    name: 'test',
    description: 'test',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await exampleGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
