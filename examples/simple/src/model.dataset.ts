import { defineDataset } from 'viteval/dataset';
import testData from '#/data';
import testNestedData from '#nested/data.js';

export default defineDataset({
  name: 'example',
  data: async () => {
    return [
      {
        input: 'Generate a random number between 0 and 100',
        expected: 1,
        ...testData,
      },
      {
        input: 'Generate a random number between 0 and 100',
        expected: 2,
        ...testNestedData,
      },
      {
        input: 'Generate a random number between 0 and 100',
        expected: 3,
        ...testNestedData,
      },
    ];
  },
});
