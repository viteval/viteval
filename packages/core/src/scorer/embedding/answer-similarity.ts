import { clamp } from '@viteval/internal';
import cosineSimilarity from 'compute-cosine-similarity';
import { createScorer } from '#/scorer/custom';
import { getEmbedding } from './embed';

export const answerSimilarity = createScorer({
  name: 'AnswerSimilarity',
  score: async ({ output, expected }) => {
    const outputStr = String(output);
    const expectedStr = String(expected);

    const [outputEmb, expectedEmb] = await Promise.all([
      getEmbedding(outputStr),
      getEmbedding(expectedStr),
    ]);

    const similarity = cosineSimilarity(outputEmb, expectedEmb) ?? 0;
    const score = clamp(similarity, 0, 1);

    return {
      score,
      metadata: { similarity },
    };
  },
});
