import { evaluate, scorers } from 'viteval';
import { mathAgent } from './math';
import mathDataset from './math.dataset';

evaluate('Math Agent', {
  data: mathDataset,
  description: 'Evaluates the math agent problem-solving capabilities',
  scorers: [scorers.answerCorrectness],
  task: async ({ input }) => {
    const result = await mathAgent.generateText(input);
    return result.text;
  },
  threshold: 0.7,
});
