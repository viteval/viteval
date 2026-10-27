import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  data: async () => [
    {
      expected: 'HELLO',
      input: 'hello',
    },
    {
      expected: 'WORLD',
      input: 'world',
    },
    {
      expected: 'VITEVAL',
      input: 'viteval',
    },
  ],
  name: 'example',
});
