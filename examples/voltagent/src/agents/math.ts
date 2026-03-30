import { openai } from '@ai-sdk/openai';
import { Agent, createTool } from '@voltagent/core';
import { z } from 'zod';

export interface MathInput {
  problem: string;
}

export interface MathOutput {
  result: number;
  explanation: string;
  steps: string[];
}

const calculatorTool = createTool({
  description: 'Perform basic arithmetic operations',
  execute: async ({ operation, numbers }) => {
    switch (operation) {
      case 'add': {
        return numbers.reduce((a, b) => a + b, 0);
      }
      case 'subtract': {
        return numbers.reduce((a, b) => a - b);
      }
      case 'multiply': {
        return numbers.reduce((a, b) => a * b, 1);
      }
      case 'divide': {
        return numbers.reduce((a, b) => a / b);
      }
      default: {
        throw new Error(`Unknown operation: ${operation}`);
      }
    }
  },
  name: 'calculator',
  parameters: z.object({
    numbers: z.array(z.number()).describe('The numbers to operate on'),
    operation: z.string().describe('The mathematical operation to perform'),
  }),
});

export const mathAgent = new Agent({
  instructions: `You are a mathematical problem-solving agent.
Solve math problems step by step using the calculator tool when needed.
Always show your work and explain your reasoning.

Return your response in JSON format:
{
  "result": number,
  "explanation": "detailed explanation",
  "steps": ["step 1", "step 2", ...]
}`,
  model: openai('gpt-4o-mini'),
  name: 'math-agent',
  tools: [calculatorTool],
});
