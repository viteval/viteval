import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'supervisor-routing',
  data: async () => {
    return [
      {
        input: {
          userQuery: 'What is the capital of Spain?',
        },
        expected: {
          expectedAgent: 'questionAnswering',
          shouldContain: 'Madrid',
        },
      },
      {
        input: {
          userQuery: 'Calculate 25 + 17',
        },
        expected: {
          expectedAgent: 'math',
          shouldContain: '42',
        },
      },
      {
        input: {
          userQuery: 'Who invented the telephone?',
        },
        expected: {
          expectedAgent: 'questionAnswering',
          shouldContain: 'Alexander Graham Bell',
        },
      },
      {
        input: {
          userQuery: 'What is 15 × 8?',
        },
        expected: {
          expectedAgent: 'math',
          shouldContain: '120',
        },
      },
      {
        input: {
          userQuery: 'Explain the concept of gravity',
        },
        expected: {
          expectedAgent: 'questionAnswering',
          shouldContain: 'force',
        },
      },
      {
        input: {
          userQuery: 'Solve: 100 ÷ 5 + 3',
        },
        expected: {
          expectedAgent: 'math',
          shouldContain: '23',
        },
      },
    ];
  },
});
