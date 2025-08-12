import { evaluate, scorers } from 'viteval';

evaluate('A test eval', {
  description: 'Generate a random number between 0 and 100',
  task: async () => {
    return 1;
  },
  scorers: [scorers.exactMatch],
  data: [
    {
      input: 'Generate a random number between 0 and 100',
      expected: 1,
    },
    {
      input: 'Generate a random number between 0 and 100',
      expected: 2,
    },
  ],
});
