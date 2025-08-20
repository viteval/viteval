import { evaluate, scorers } from 'viteval';
import { mathAgent } from './math';
import mathDataset from './math.dataset';

evaluate('Math Agent', {
  description: 'Evaluates the math agent problem-solving capabilities',
  data: mathDataset,
  task: async ({ input }) => {
    const result = await mathAgent.generateText(input);
    return result.text;
  },
  scorers: [scorers.answerCorrectness],
  threshold: 0.7,
});
