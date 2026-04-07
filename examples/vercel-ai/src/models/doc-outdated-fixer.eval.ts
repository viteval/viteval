import { evaluate, scorers } from 'viteval';
import dataset from './doc-outdated-fixer.dataset';

evaluate('Doc Outdated Fixer', {
  data: dataset,
  description:
    'Evaluates the ability to detect and fix outdated documentation based on code changes',
  scorers: [scorers.answerCorrectness()],
  task: async () => JSON.stringify({
      changes: ['Updated references'],
      confidence: 90,
      content: 'Updated documentation content',
      summary: 'Fixed outdated documentation',
    }),
  threshold: 0.5,
});
