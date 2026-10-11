import { evaluate, scorers } from 'viteval';
import exampleDataset from './model.dataset';

evaluate('Parse numbers', {
  data: exampleDataset,
  description: 'Parse numeric strings into numbers',
  scorers: [scorers.exactMatch()],
  task: ({ input }) => Number(input),
});
