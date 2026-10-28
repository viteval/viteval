import { evaluate, scorers } from 'viteval';
import exampleDataset from './model.dataset';

evaluate('uppercase', {
  data: exampleDataset,
  description: 'Convert each input to uppercase',
  scorers: [scorers.exactMatch()],
  task: ({ input }) => input.toUpperCase(),
});
