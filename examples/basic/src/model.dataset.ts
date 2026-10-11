import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  data: async () => [
    {
      expected: 1,
      input: '1',
    },
    {
      expected: 2,
      input: '2',
    },
    {
      expected: 3,
      input: '3',
    },
  ],
  name: 'number-parsing',
});
