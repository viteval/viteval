import { describe, expect, it } from 'vitest';
import { parseInvocation } from './argv';

describe('parseInvocation', () => {
  it.each(['init', 'data', 'ui'])(
    'should route %s through the project command shell',
    (name) => {
      expect(parseInvocation([name]).isEvaluation).toBe(false);
      expect(parseInvocation([name]).isBare).toBe(false);
    }
  );

  it.each(['run', 'list'])(
    'should identify %s as an evaluation command',
    (name) => {
      expect(parseInvocation([name]).isEvaluation).toBe(true);
      expect(parseInvocation([name]).isBare).toBe(false);
    }
  );

  it('should treat an empty invocation and a cwd-only invocation as a bare run', () => {
    expect(parseInvocation([])).toMatchObject({
      isBare: true,
      isEvaluation: true,
      cwd: undefined,
    });
    expect(parseInvocation(['--cwd', './app'])).toMatchObject({
      args: [],
      cwd: './app',
      isBare: true,
      isEvaluation: true,
    });
  });

  it.each(['--help', '-h', '--version', '-v'])(
    'should pass standalone %s through to the project command shell',
    (flag) => {
      expect(parseInvocation([flag]).isBare).toBe(false);
      expect(parseInvocation([flag]).isEvaluation).toBe(false);
    }
  );

  it.each([
    ['run', 'basic.eval.ts'],
    ['list', '--json'],
    ['run', '--watch'],
    ['data', '--overwrite'],
  ])('should preserve command tokens: %j', (...args) => {
    expect(parseInvocation(args)).toEqual({
      args,
      cwd: undefined,
      isBare: false,
      isEvaluation: args[0] === 'run' || args[0] === 'list',
    });
  });

  it.each([
    ['--cwd', './app', 'run', '--root', 'src'],
    ['run', '--cwd=./app', '--root', 'src'],
    ['--cwd=./app', 'data'],
  ])('should remove only the working directory override: %j', (...args) => {
    expect(parseInvocation(args)).toMatchObject({
      cwd: './app',
      isBare: false,
    });
  });

  it.each([['--cwd'], ['--cwd', '--help'], ['--cwd='], ['--cwd=--help']])(
    'should reject missing working directories: %j',
    (...args) => {
      expect(() => parseInvocation(args)).toThrow('--cwd requires a directory');
    }
  );
});
