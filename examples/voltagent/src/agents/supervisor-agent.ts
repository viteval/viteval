import { openai } from '@ai-sdk/openai';
import { Agent } from '@voltagent/core';
import { VercelAIProvider } from '@voltagent/vercel-ai';
import { mathAgent } from './math-agent.js';
import { questionAnsweringAgent } from './question-answering-agent.js';

export interface SupervisorInput {
  userQuery: string;
}

export interface SupervisorOutput {
  response: string;
  agentUsed: string;
}

export const supervisorAgent = new Agent({
  name: 'supervisor-agent',
  instructions: `You are a supervisor agent that routes user queries to the appropriate specialized agent.

Available agents:
- questionAnswering: For general questions and knowledge queries
- math: For mathematical problems and calculations

Analyze the user query and decide which agent should handle it.
First determine if the query is mathematical or general knowledge, then route accordingly.
Return your response indicating which agent you would use and why.`,
  llm: new VercelAIProvider(),
  model: openai('gpt-4o-mini'),
  agents: [questionAnsweringAgent, mathAgent],
});
