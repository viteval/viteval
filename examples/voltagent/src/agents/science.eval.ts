import { evaluate, scorers } from 'viteval';
import { scienceAgent } from './science';
import scienceDataset from './science.dataset';

evaluate('Science Agent', {
  description: 'Evaluates the science agent knowledge and accuracy',
  data: scienceDataset,
  task: async ({ input }) => {
    const result = await scienceAgent.generateText(input);
    return result.text;
  },
  scorers: [scorers.answerCorrectness],
  threshold: 0.7,
});
