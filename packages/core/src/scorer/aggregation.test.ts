import { describe, expect, it } from 'vitest';
import type { Score } from '#/types';
import { getMeanScore, getMedianScore, getSumScore } from './aggregation';

describe('Aggregation Functions', () => {
  describe('getMeanScore', () => {
    it('should calculate mean of numeric scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: 20 },
        { name: 'scorer3', score: 30 },
      ];

      expect(getMeanScore(scores)).toBe(20);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 20 },
      ];

      expect(getMeanScore(scores)).toBe(10);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 15 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 25 },
      ];

      expect(getMeanScore(scores)).toBeCloseTo(13.33, 2);
    });

    it('should handle mixed null/numeric scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 5 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: null },
        { name: 'scorer4', score: 15 },
      ];

      expect(getMeanScore(scores)).toBe(5);
    });

    it('should return 0 for empty array', () => {
      const scores: Score[] = [];

      expect(getMeanScore(scores)).toBe(0);
    });

    it('should handle single score', () => {
      const scores: Score[] = [{ name: 'scorer1', score: 42 }];

      expect(getMeanScore(scores)).toBe(42);
    });

    it('should handle decimal scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 3.5 },
        { name: 'scorer2', score: 4.5 },
        { name: 'scorer3', score: 5.0 },
      ];

      expect(getMeanScore(scores)).toBeCloseTo(4.33, 2);
    });
  });

  describe('getMedianScore', () => {
    it('should calculate median of odd number of scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: 30 },
        { name: 'scorer3', score: 20 },
      ];

      expect(getMedianScore(scores)).toBe(20);
    });

    it('should calculate median of even number of scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: 20 },
        { name: 'scorer3', score: 30 },
        { name: 'scorer4', score: 40 },
      ];

      expect(getMedianScore(scores)).toBe(25);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 30 },
      ];

      expect(getMedianScore(scores)).toBe(10);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 15 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 25 },
      ];

      expect(getMedianScore(scores)).toBe(15);
    });

    it('should sort scores before calculating median', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 50 },
        { name: 'scorer2', score: 10 },
        { name: 'scorer3', score: 30 },
      ];

      expect(getMedianScore(scores)).toBe(30);
    });

    it('should return 0 for empty array', () => {
      const scores: Score[] = [];

      expect(getMedianScore(scores)).toBe(0);
    });

    it('should handle single score', () => {
      const scores: Score[] = [{ name: 'scorer1', score: 42 }];

      expect(getMedianScore(scores)).toBe(42);
    });

    it('should handle all null scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: null },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: null },
      ];

      expect(getMedianScore(scores)).toBe(0);
    });
  });

  describe('getSumScore', () => {
    it('should calculate sum of numeric scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: 20 },
        { name: 'scorer3', score: 30 },
      ];

      expect(getSumScore(scores)).toBe(60);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 10 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 20 },
      ];

      expect(getSumScore(scores)).toBe(30);
    });

    it('should handle null scores by treating them as 0', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 15 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: 25 },
      ];

      expect(getSumScore(scores)).toBe(40);
    });

    it('should handle mixed null/numeric scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 5 },
        { name: 'scorer2', score: null },
        { name: 'scorer3', score: null },
        { name: 'scorer4', score: 15 },
      ];

      expect(getSumScore(scores)).toBe(20);
    });

    it('should return 0 for empty array', () => {
      const scores: Score[] = [];

      expect(getSumScore(scores)).toBe(0);
    });

    it('should handle single score', () => {
      const scores: Score[] = [{ name: 'scorer1', score: 42 }];

      expect(getSumScore(scores)).toBe(42);
    });

    it('should handle decimal scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: 3.5 },
        { name: 'scorer2', score: 4.5 },
        { name: 'scorer3', score: 5.0 },
      ];

      expect(getSumScore(scores)).toBe(13);
    });

    it('should handle negative scores', () => {
      const scores: Score[] = [
        { name: 'scorer1', score: -10 },
        { name: 'scorer2', score: 20 },
        { name: 'scorer3', score: -5 },
      ];

      expect(getSumScore(scores)).toBe(5);
    });
  });
});
