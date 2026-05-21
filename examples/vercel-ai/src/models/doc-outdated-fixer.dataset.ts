import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  data: async () => [
    {
      expected: 'Fixed outdated documentation',
      input: 'Update documentation for the renamed API method.',
    },
  ],
  name: 'doc-outdated-fixer',
  storage: 'local',
});
