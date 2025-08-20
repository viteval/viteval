import { evaluate, scorers } from 'viteval';
import { geographyAgent } from './geography';
import geographyDataset from './geography.dataset';

evaluate('Geography Agent', {
  description: 'Evaluates the geography agent knowledge and accuracy',
  data: geographyDataset,
  task: async ({ input }) => {
    const result = await geographyAgent.generateText(input);
    return result.text;
  },
  scorers: [scorers.answerCorrectness],
  threshold: 0.7,
});
