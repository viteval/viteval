import { evaluate, scorers } from 'viteval';
import supervisorDataset from './supervisor.dataset.js';
import { supervisorAgent } from './supervisor-agent.js';

// Supervisor Agent Evaluation
evaluate('Supervisor Agent', {
  description: 'Evaluates the supervisor agent routing decisions',
  task: async (input: { userQuery: string }) => {
    const result = await supervisorAgent.run(input);
    return {
      response: result.response,
      agentUsed: result.agentUsed,
    };
  },
  scorers: [
    scorers.llmJudge({
      model: 'gpt-4',
      criteria: 'Correct agent routing and response quality',
    }),
    // Custom scorer for routing accuracy
    {
      name: 'routing-accuracy',
      score: async (output: any, expected: any) => {
        return output.agentUsed === expected.expectedAgent ? 1 : 0;
      },
    },
  ],
  data: supervisorDataset,
});
