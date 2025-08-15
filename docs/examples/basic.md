# Basic Evaluation Examples

Learn the fundamentals of Viteval with these simple examples.

## Hello World Evaluation

The simplest possible evaluation:

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Hello World', {
  data: async () => [
    { input: "Say hello", expected: "Hello!" },
  ],
  task: async (input) => {
    // Your LLM call here
    return "Hello!";
  },
  scorers: [scorers.exactMatch],
  threshold: 1.0,
});
```

## Color Recognition

A simple knowledge-based evaluation:

```ts
evaluate('Color recognition', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
    { input: "What color is snow?", expected: "White" },
    { input: "What color is the sun?", expected: "Yellow" },
  ],
  task: async (input) => {
    const response = await fetch('/api/llm', {
      method: 'POST',
      body: JSON.stringify({ prompt: input }),
    });
    const result = await response.json();
    return result.text;
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

## Math Problems

Testing numerical reasoning:

```ts
evaluate('Simple arithmetic', {
  data: async () => [
    { input: "What is 2 + 2?", expected: "4" },
    { input: "What is 5 - 3?", expected: "2" },
    { input: "What is 3 * 4?", expected: "12" },
    { input: "What is 8 / 2?", expected: "4" },
  ],
  task: async (input) => {
    return await solveMathProblem(input);
  },
  scorers: [scorers.exactMatch],
  threshold: 0.9,
});
```

## Different Scoring Methods

### Exact Match Scoring

Perfect for structured outputs:

```ts
evaluate('Country capitals', {
  data: async () => [
    { input: "Capital of France", expected: "Paris" },
    { input: "Capital of Italy", expected: "Rome" },
    { input: "Capital of Japan", expected: "Tokyo" },
  ],
  task: async (input) => await getCapital(input),
  scorers: [scorers.exactMatch],
  threshold: 1.0, // Require perfect answers
});
```

### Fuzzy String Matching

More forgiving for text variations:

```ts
evaluate('Animal sounds', {
  data: async () => [
    { input: "What sound does a cow make?", expected: "Moo" },
    { input: "What sound does a dog make?", expected: "Woof" },
    { input: "What sound does a cat make?", expected: "Meow" },
  ],
  task: async (input) => await getAnimalSound(input),
  scorers: [scorers.levenshtein],
  threshold: 0.7, // Allow for variations like "moo", "MOO", "mooo"
});
```

### Semantic Similarity

For meaning-based evaluation:

```ts
evaluate('Definition understanding', {
  data: async () => [
    { 
      input: "What is a democracy?", 
      expected: "A system of government where people vote for their leaders" 
    },
    { 
      input: "What is photosynthesis?", 
      expected: "The process plants use to make food from sunlight" 
    },
  ],
  task: async (input) => await explainConcept(input),
  scorers: [scorers.answerSimilarity],
  threshold: 0.75,
});
```

## Multiple Test Cases

Testing various scenarios:

```ts
evaluate('Greeting responses', {
  data: async () => [
    // Formal greetings
    { input: "Good morning", expected: "Good morning! How may I assist you?" },
    { input: "Good afternoon", expected: "Good afternoon! How can I help?" },
    
    // Casual greetings
    { input: "Hi", expected: "Hello! What can I do for you?" },
    { input: "Hey", expected: "Hi there! How can I help?" },
    
    // Different languages
    { input: "Hola", expected: "Hello! How can I assist you?" },
    { input: "Bonjour", expected: "Hello! How may I help you?" },
  ],
  task: async (input) => await generateGreeting(input),
  scorers: [scorers.answerSimilarity],
  threshold: 0.8,
});
```

## Error Handling

Graceful handling of edge cases:

```ts
evaluate('Robust evaluation', {
  data: async () => [
    { input: "Normal question", expected: "Normal answer" },
    { input: "", expected: "I need a question to answer" },
    { input: "????????", expected: "I don't understand" },
  ],
  task: async (input) => {
    try {
      if (!input || input.trim() === '') {
        return "I need a question to answer";
      }
      
      const result = await processInput(input);
      return result || "I don't understand";
    } catch (error) {
      return "I encountered an error processing your request";
    }
  },
  scorers: [scorers.levenshtein],
  threshold: 0.7,
});
```

## Real-World Example: FAQ Bot

A practical customer service evaluation:

```ts
evaluate('FAQ responses', {
  data: async () => [
    {
      input: "What are your business hours?",
      expected: "We're open Monday through Friday, 9 AM to 6 PM EST",
    },
    {
      input: "How do I return an item?",
      expected: "You can return items within 30 days. Please contact support for a return label",
    },
    {
      input: "Do you ship internationally?",
      expected: "Yes, we ship to most countries. Shipping times vary by location",
    },
    {
      input: "What payment methods do you accept?",
      expected: "We accept all major credit cards, PayPal, and Apple Pay",
    },
  ],
  task: async (input) => {
    const response = await faqBot.getResponse(input);
    return response.text;
  },
  scorers: [
    scorers.answerRelevancy,  // Must be relevant to question
    scorers.factual,          // Must be factually correct
    scorers.moderation,       // Must be appropriate
  ],
  threshold: 0.85,
});
```

## Testing Different Models

Compare model performance:

```ts
// GPT-4 evaluation
evaluate('GPT-4 responses', {
  data: async () => await loadTestCases(),
  task: async (input) => {
    return await generateText({
      model: 'gpt-4',
      prompt: input,
      temperature: 0.1,
    });
  },
  scorers: [scorers.factual],
  threshold: 0.9,
});

// Claude evaluation  
evaluate('Claude responses', {
  data: async () => await loadTestCases(), // Same test data
  task: async (input) => {
    return await generateText({
      model: 'claude-3-sonnet',
      prompt: input,
      temperature: 0.1,
    });
  },
  scorers: [scorers.factual], // Same scorer
  threshold: 0.9,
});
```

## Running the Examples

1. **Save any example** to a file like `basic.eval.ts`
2. **Install Viteval**: `npm install viteval`
3. **Set up your LLM function** (replace the task function with your actual LLM call)
4. **Run the evaluation**: `npx viteval basic.eval.ts`

### Example Output

```
✓ Color recognition (4/4 passed)
  ✓ What color is the sky? → Blue (score: 1.0)
  ✓ What color is grass? → Green (score: 1.0)
  ✓ What color is snow? → White (score: 1.0)  
  ✓ What color is the sun? → Yellow (score: 1.0)

Evaluations: 1 passed, 0 failed
Time: 2.34s
```

## Next Steps

- [Learn about datasets](/examples/datasets) for reusable test data
- [Create custom scorers](/examples/scorers) for specific evaluation needs
- [Explore advanced patterns](/examples/advanced) for complex scenarios