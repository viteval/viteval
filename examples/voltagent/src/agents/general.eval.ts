import { evaluate, scorers } from 'viteval';
import { generalAgent } from './general';
import generalDataset from './general.dataset';

evaluate('General Agent', {
  data: generalDataset,
  description: 'Evaluates the general question-answering agent capabilities',
  scorers: [scorers.answerCorrectness()],
  task: async ({ input }) => {
    const result = await generalAgent.generateText(input);
    return result.text;
  },
  threshold: 0.6,
});
