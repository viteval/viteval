import { evaluate, scorers } from 'viteval';
import { geographyAgent } from './geography';
import geographyDataset from './geography.dataset';

evaluate('Geography Agent', {
  data: geographyDataset,
  description: 'Evaluates the geography agent knowledge and accuracy',
  scorers: [scorers.answerCorrectness],
  task: async ({ input }) => {
    const result = await geographyAgent.generateText(input);
    return result.text;
  },
  threshold: 0.7,
});
