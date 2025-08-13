import { defineDataset } from 'viteval';

export default defineDataset({
  name: 'example',
  data: async () => {
    return [
      {
        input: 'Generate a random number between 0 and 100',
        expected: 1,
      },
      {
        input: 'Generate a random number between 0 and 100',
        expected: 2,
      },
      {
        input: 'Generate a random number between 0 and 100',
        expected: 3,
      },
    ];
  },
});
