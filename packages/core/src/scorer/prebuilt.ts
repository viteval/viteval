import {
  AnswerCorrectness,
  AnswerRelevancy,
  AnswerSimilarity,
  ContextEntityRecall,
  ContextPrecision,
  ContextRecall,
  ContextRelevancy,
  EmbeddingSimilarity,
  ExactMatch,
  Factuality,
  Humor,
  JSONDiff,
  Levenshtein,
  ListContains,
  Moderation,
  NumericDiff,
  Possible,
  Sql,
  Summary,
  Translation,
} from 'autoevals';

interface Scorers {
  factual: typeof Factuality;
  levenshtein: typeof Levenshtein;
  exactMatch: typeof ExactMatch;
  moderation: typeof Moderation;
  sql: typeof Sql;
  summary: typeof Summary;
  translation: typeof Translation;
  answerCorrectness: typeof AnswerCorrectness;
  answerRelevancy: typeof AnswerRelevancy;
  answerSimilarity: typeof AnswerSimilarity;
  contextEntityRecall: typeof ContextEntityRecall;
  contextPrecision: typeof ContextPrecision;
  contextRecall: typeof ContextRecall;
  contextRelevancy: typeof ContextRelevancy;
  possible: typeof Possible;
  embeddingSimilarity: typeof EmbeddingSimilarity;
  listContains: typeof ListContains;
  numericDiff: typeof NumericDiff;
  jsonDiff: typeof JSONDiff;
  humor: typeof Humor;
}

export const scorers: Scorers = {
  answerCorrectness: AnswerCorrectness,
  answerRelevancy: AnswerRelevancy,
  answerSimilarity: AnswerSimilarity,
  contextEntityRecall: ContextEntityRecall,
  contextPrecision: ContextPrecision,
  contextRecall: ContextRecall,
  contextRelevancy: ContextRelevancy,
  embeddingSimilarity: EmbeddingSimilarity,
  exactMatch: ExactMatch,
  factual: Factuality,
  humor: Humor,
  jsonDiff: JSONDiff,
  levenshtein: Levenshtein,
  listContains: ListContains,
  moderation: Moderation,
  numericDiff: NumericDiff,
  possible: Possible,
  sql: Sql,
  summary: Summary,
  translation: Translation,
};
