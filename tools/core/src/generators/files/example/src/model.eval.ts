import { evaluate, scorers } from 'viteval';
import exampleDataset from './model.dataset';

evaluate('A test eval', {
  data: exampleDataset,
  description: 'Generate a random number between 0 and 100',
  scorers: [scorers.exactMatch],
  task: async () => 1,
});
