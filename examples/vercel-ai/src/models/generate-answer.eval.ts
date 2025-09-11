import { evaluate, scorers } from 'viteval';
import generateAnswer from './generate-answer';
import dataset from './generate-answer.dataset';

evaluate('Generate an answer to a question', {
  data: dataset,
  task: async ({ input, category }) => {
    const answer = await generateAnswer(input, category);
    return answer;
  },
  scorers: [scorers.answerCorrectness],
  threshold: 0.5,
});
