import {
  exactMatch,
  levenshteinScorer,
  numericDiff,
  jsonDiff,
  listContains,
} from './deterministic';
import {
  embeddingSimilarity,
  answerSimilarity,
} from './embedding';
import {
  factuality,
  summary,
  translation,
  moderation,
  answerCorrectness,
  answerRelevancy,
  contextEntityRecall,
  contextPrecision,
  contextRecall,
  contextRelevancy,
  possible,
  humor,
  sql,
} from './llm';

export const scorers = {
  factual: factuality,
  levenshtein: levenshteinScorer,
  exactMatch,
  moderation,
  sql,
  summary,
  translation,
  answerCorrectness,
  answerRelevancy,
  answerSimilarity,
  contextEntityRecall,
  contextPrecision,
  contextRecall,
  contextRelevancy,
  possible,
  embeddingSimilarity,
  listContains,
  numericDiff,
  jsonDiff,
  humor,
};
