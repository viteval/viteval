import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  data: async () => [
    {
      expected: 1,
      input: 'Generate a random number between 0 and 100',
    },
    {
      expected: 2,
      input: 'Generate a random number between 0 and 100',
    },
    {
      expected: 3,
      input: 'Generate a random number between 0 and 100',
    },
  ],
  name: 'example',
});
