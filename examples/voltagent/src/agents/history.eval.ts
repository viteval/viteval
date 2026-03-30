import { evaluate, scorers } from 'viteval';
import { historyAgent } from './history';
import historyDataset from './history.dataset';

evaluate('History Agent', {
  data: historyDataset,
  description: 'Evaluates the history agent knowledge and accuracy',
  scorers: [scorers.answerCorrectness()],
  task: async ({ input }) => {
    const result = await historyAgent.generateText(input);
    return result.text;
  },
  threshold: 0.7,
});
