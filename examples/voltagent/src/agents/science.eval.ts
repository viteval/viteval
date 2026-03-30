import { evaluate, scorers } from 'viteval';
import { scienceAgent } from './science';
import scienceDataset from './science.dataset';

evaluate('Science Agent', {
  data: scienceDataset,
  description: 'Evaluates the science agent knowledge and accuracy',
  scorers: [scorers.answerCorrectness()],
  task: async ({ input }) => {
    const result = await scienceAgent.generateText(input);
    return result.text;
  },
  threshold: 0.7,
});
