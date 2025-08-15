# Dataset Examples

Learn how to create and manage reusable datasets for your evaluations.

## Static Datasets

### Simple Knowledge Base

```ts
import { defineDataset } from 'viteval/dataset';

const worldCapitals = defineDataset({
  name: 'world-capitals',
  data: () => [
    { input: "What is the capital of France?", expected: "Paris" },
    { input: "What is the capital of Japan?", expected: "Tokyo" },
    { input: "What is the capital of Brazil?", expected: "Brasília" },
    { input: "What is the capital of Australia?", expected: "Canberra" },
    { input: "What is the capital of Canada?", expected: "Ottawa" },
  ],
  metadata: {
    category: 'geography',
    difficulty: 'easy',
    source: 'manual_curation',
  },
});
```

### Customer Support Questions

```ts
const supportQuestions = defineDataset({
  name: 'customer-support',
  data: () => [
    {
      input: "How do I reset my password?",
      expected: "You can reset your password by clicking 'Forgot Password' on the login page",
    },
    {
      input: "What's your return policy?",
      expected: "We accept returns within 30 days of purchase with original receipt",
    },
    {
      input: "Do you offer international shipping?",
      expected: "Yes, we ship to over 50 countries worldwide",
    },
  ],
  metadata: {
    department: 'customer_service',
    priority: 'high',
  },
});
```

## Dynamic Datasets

### Math Problem Generator

```ts
const mathProblems = defineDataset({
  name: 'arithmetic-problems',
  data: async () => {
    const problems = [];
    const operations = ['+', '-', '*'];
    
    for (let i = 0; i < 200; i++) {
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const op = operations[Math.floor(Math.random() * operations.length)];
      
      let result: number;
      switch (op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        default: result = 0;
      }
      
      problems.push({
        input: `What is ${a} ${op} ${b}?`,
        expected: String(result),
        metadata: { operation: op, difficulty: a > 25 || b > 25 ? 'hard' : 'easy' },
      });
    }
    
    return problems;
  },
  cache: true, // Cache the generated problems
  version: '1.0.0',
});
```

### Code Generation Dataset

```ts
const codeProblems = defineDataset({
  name: 'python-functions',
  data: async () => {
    const problems = [
      {
        input: "Write a function to check if a number is prime",
        expected: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True`,
        metadata: { difficulty: 'medium', topic: 'algorithms' },
      },
      {
        input: "Write a function to reverse a string",
        expected: `def reverse_string(s):
    return s[::-1]`,
        metadata: { difficulty: 'easy', topic: 'strings' },
      },
      {
        input: "Write a function to find the factorial of a number",
        expected: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)`,
        metadata: { difficulty: 'easy', topic: 'recursion' },
      },
    ];
    
    return problems;
  },
});
```

## API-Based Datasets

### External Data Source

```ts
const newsArticles = defineDataset({
  name: 'news-summaries',
  data: async () => {
    try {
      const response = await fetch('https://api.example.com/articles', {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`,
        },
      });
      
      const articles = await response.json();
      
      return articles.map(article => ({
        input: article.content,
        expected: article.summary,
        metadata: {
          category: article.category,
          date: article.published_date,
          length: article.content.length,
        },
      }));
    } catch (error) {
      console.warn('Failed to fetch articles, using fallback data');
      return [
        {
          input: "Sample article content...",
          expected: "Sample summary...",
        },
      ];
    }
  },
  cache: false, // Don't cache as data changes frequently
});
```

### Database Integration

```ts
import { sql } from './db-connection';

const userQuestions = defineDataset({
  name: 'user-questions-db',
  data: async () => {
    const rows = await sql`
      SELECT question, approved_answer, category, difficulty_level
      FROM user_questions 
      WHERE is_approved = true 
      AND created_at > NOW() - INTERVAL '30 days'
      LIMIT 1000
    `;
    
    return rows.map(row => ({
      input: row.question,
      expected: row.approved_answer,
      metadata: {
        category: row.category,
        difficulty: row.difficulty_level,
      },
    }));
  },
  cache: true,
  version: '1.1.0',
});
```

## LLM-Generated Datasets

### Question Generation

```ts
import { generateObject } from 'ai';
import { z } from 'zod';

const generatedQuestions = defineDataset({
  name: 'ai-generated-qa',
  data: async () => {
    const topics = ['science', 'history', 'literature', 'math'];
    const questions = [];
    
    for (const topic of topics) {
      for (let i = 0; i < 25; i++) {
        const { object: qa } = await generateObject({
          model: 'gpt-4',
          prompt: `Generate a ${topic} question and its correct answer. Make it educational and factual.`,
          schema: z.object({
            question: z.string().describe('The question to ask'),
            answer: z.string().describe('The correct answer'),
            difficulty: z.enum(['easy', 'medium', 'hard']).describe('Question difficulty'),
          }),
        });
        
        questions.push({
          input: qa.question,
          expected: qa.answer,
          metadata: {
            topic,
            difficulty: qa.difficulty,
            generated: true,
          },
        });
      }
    }
    
    return questions;
  },
  cache: true, // Cache expensive LLM generations
  version: '2.0.0',
});
```

## Complex Input Datasets

### Structured Input

```ts
interface ChatContext {
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
}

const chatDataset = defineDataset<ChatContext>({
  name: 'chat-conversations',
  data: () => [
    {
      input: {
        messages: [
          { role: 'user', content: 'Hello, can you help me with my order?' },
        ],
        systemPrompt: 'You are a helpful customer service representative.',
      },
      expected: 'Hello! I\'d be happy to help you with your order. Could you please provide your order number?',
    },
    {
      input: {
        messages: [
          { role: 'user', content: 'What is the weather like?' },
          { role: 'assistant', content: 'I need your location to check the weather.' },
          { role: 'user', content: 'San Francisco' },
        ],
        systemPrompt: 'You are a weather assistant.',
      },
      expected: 'In San Francisco, it is currently sunny with a temperature of 68°F.',
    },
  ],
});
```

### Multi-Modal Datasets

```ts
const imageDescriptions = defineDataset({
  name: 'image-descriptions',
  data: async () => {
    const imageData = await loadImageMetadata();
    
    return imageData.map(item => ({
      input: {
        imageUrl: item.url,
        prompt: 'Describe this image in detail',
      },
      expected: item.human_description,
      metadata: {
        imageType: item.type,
        complexity: item.complexity_score,
      },
    }));
  },
});
```

## Dataset Composition

### Combining Multiple Datasets

```ts
const combinedDataset = defineDataset({
  name: 'all-knowledge',
  data: async () => {
    const [capitals, math, support] = await Promise.all([
      worldCapitals.data(),
      mathProblems.data(),
      supportQuestions.data(),
    ]);
    
    return [
      ...capitals.map(item => ({ ...item, metadata: { ...item.metadata, source: 'capitals' } })),
      ...math.map(item => ({ ...item, metadata: { ...item.metadata, source: 'math' } })),
      ...support.map(item => ({ ...item, metadata: { ...item.metadata, source: 'support' } })),
    ];
  },
  version: '1.0.0',
});
```

### Filtered Datasets

```ts
const easyQuestions = defineDataset({
  name: 'easy-questions-only',
  data: async () => {
    const allQuestions = await combinedDataset.data();
    return allQuestions.filter(item => 
      item.metadata?.difficulty === 'easy'
    );
  },
});

const recentQuestions = defineDataset({
  name: 'recent-questions',
  data: async () => {
    const allQuestions = await userQuestions.data();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return allQuestions.filter(item => 
      new Date(item.metadata?.date) > thirtyDaysAgo
    );
  },
});
```

## Dataset Versioning

### Versioned Dataset Evolution

```ts
// Version 1.0 - Simple questions
const questionsV1 = defineDataset({
  name: 'knowledge-questions',
  version: '1.0.0',
  data: () => [
    { input: "What is 2+2?", expected: "4" },
  ],
});

// Version 2.0 - Added metadata and more questions
const questionsV2 = defineDataset({
  name: 'knowledge-questions',
  version: '2.0.0',
  data: () => [
    { 
      input: "What is 2+2?", 
      expected: "4",
      metadata: { difficulty: 'easy', category: 'math' }
    },
    { 
      input: "What is the square root of 16?", 
      expected: "4",
      metadata: { difficulty: 'medium', category: 'math' }
    },
  ],
});
```

## Using Datasets in Evaluations

### Single Dataset

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Geography knowledge', {
  data: () => worldCapitals.data(),
  task: async (input) => await answerQuestion(input),
  scorers: [scorers.exactMatch],
  threshold: 0.9,
});
```

### Multiple Datasets

```ts
evaluate('Customer service responses', {
  data: async () => {
    const [support, faq] = await Promise.all([
      supportQuestions.data(),
      faqDataset.data(),
    ]);
    return [...support, ...faq];
  },
  task: async (input) => await generateResponse(input),
  scorers: [scorers.answerRelevancy, scorers.moderation],
  threshold: 0.85,
});
```

## Dataset Management CLI

### Generate All Datasets

```bash
# Generate all datasets
viteval data

# Generate specific dataset
viteval data --name "math-problems"

# Force regeneration (ignore cache)  
viteval data --force

# List all available datasets
viteval data --list
```

### Dataset Information

```bash
# Show dataset details
viteval data --info --name "world-capitals"

# Validate all datasets
viteval data --validate

# Preview dataset without saving
viteval data --name "user-questions" --dry-run
```

## Best Practices

### Naming Conventions

```ts
// Good: Descriptive, kebab-case
defineDataset({ name: 'customer-support-faq' });
defineDataset({ name: 'python-code-examples' });

// Avoid: Generic or unclear names
defineDataset({ name: 'data' });
defineDataset({ name: 'questions' });
```

### Performance Optimization

```ts
// Cache expensive operations
defineDataset({
  name: 'expensive-generated-data',
  data: async () => await expensiveGeneration(),
  cache: true, // Cache the result
});

// Don't cache frequently changing data
defineDataset({
  name: 'live-api-data',
  data: async () => await fetchLatestData(),
  cache: false, // Always fetch fresh data
});
```

### Error Handling

```ts
defineDataset({
  name: 'robust-dataset',
  data: async () => {
    try {
      return await fetchPrimaryData();
    } catch (error) {
      console.warn('Primary data source failed, using backup');
      try {
        return await fetchBackupData();
      } catch (backupError) {
        console.warn('Backup data source failed, using fallback');
        return getFallbackData();
      }
    }
  },
});
```