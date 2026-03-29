import { evaluate, scorers } from 'viteval';
import { supervisorAgent } from './supervisor';
import supervisorDataset from './supervisor.dataset';

evaluate('Supervisor Agent', {
  data: supervisorDataset,
  description: 'Evaluates the supervisor agent routing decisions',
  scorers: [scorers.answerCorrectness],
  task: async ({ input }) => {
    const result = await supervisorAgent.generateText(input);
    return result.text;
  },
  threshold: 0.5,
});
