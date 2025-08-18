# VoltAgent Evaluation Example

This example demonstrates how to write comprehensive evaluations for VoltAgent AI agents using Viteval.

## Overview

This example includes three types of agents and their corresponding evaluations:

1. **Question Answering Agent** - Handles general knowledge questions
2. **Math Agent** - Solves mathematical problems with tool usage
3. **Supervisor Agent** - Routes queries to appropriate specialized agents

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

3. **Run evaluations:**
```bash
npm run eval
```

## Agent Examples

### Question Answering Agent
- Handles general knowledge and factual questions
- Supports optional context for better answers
- Returns confidence scores with answers

### Math Agent
- Solves mathematical problems step by step
- Uses calculator tools for accurate computations
- Provides detailed explanations and solution steps

### Supervisor Agent
- Routes user queries to appropriate specialized agents
- Coordinates multi-agent workflows
- Returns both the response and which agent was used

## Evaluation Strategies

### Scoring Methods
- **Exact Match**: For mathematical results
- **Includes**: For checking if key information is present
- **LLM Judge**: For evaluating answer quality and relevance
- **Custom Scorers**: For specific metrics like routing accuracy

### Dataset Structure
Each agent has its own dataset with relevant test cases:
- Question answering: Knowledge questions with expected answers
- Math problems: Mathematical expressions with expected results
- Supervisor routing: Queries with expected agent assignments

## File Structure

```
src/
├── agents/
│   ├── question-answering-agent.ts
│   ├── math-agent.ts
│   └── supervisor-agent.ts
├── datasets/
│   ├── question-answering.dataset.ts
│   ├── math.dataset.ts
│   └── supervisor.dataset.ts
└── model.eval.ts
```

## Key Features Demonstrated

- **Multi-agent coordination** with supervisor patterns
- **Tool integration** for enhanced capabilities
- **Comprehensive evaluation** with multiple scoring methods
- **Custom scorers** for domain-specific metrics
- **Dataset organization** for different agent types

## 📄 License

MIT License - see LICENSE file for details.
