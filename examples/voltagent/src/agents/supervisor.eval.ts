import { evaluate, scorers } from 'viteval';
import { supervisorAgent } from './supervisor';
import supervisorDataset from './supervisor.dataset';

evaluate('Supervisor Agent', {
  description: 'Evaluates the supervisor agent routing decisions',
  data: supervisorDataset,
  task: async ({ input }) => {
    const result = await supervisorAgent.generateText(input);
    return result.text;
  },
  scorers: [scorers.answerCorrectness],
  threshold: 0.5,
});
