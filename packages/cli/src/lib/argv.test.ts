import { describe, expect, it } from 'vitest';
import { parseInvocation } from './argv';

describe('parseInvocation', () => {
  it.each(['init', 'data', 'ui'])(
    'should route %s to project commands',
    (name) => {
      expect(parseInvocation([name]).isProjectCommand).toBe(true);
    }
  );

  it.each(['--help', '-h', '--version', '-v'])(
    'should route standalone %s to Viteval help',
    (flag) => {
      expect(parseInvocation([flag]).isRootHelp).toBe(true);
      expect(parseInvocation(['run', flag]).isRootHelp).toBe(false);
    }
  );

  it.each([
    [],
    ['list', '--json'],
    ['bench', '--run'],
    ['run', '--retry', '2'],
  ])('should preserve native tokens: %j', (...args) => {
    expect(parseInvocation(args)).toEqual({
      args,
      cwd: undefined,
      isProjectCommand: false,
      isRootHelp: false,
    });
  });

  it.each([
    ['--cwd', './app', 'run', '--root', 'src'],
    ['run', '--cwd=./app', '--root', 'src'],
  ])('should remove only the working directory override: %j', (...args) => {
    expect(parseInvocation(args)).toEqual({
      args: ['run', '--root', 'src'],
      cwd: './app',
      isProjectCommand: false,
      isRootHelp: false,
    });
  });

  it.each([['--cwd'], ['--cwd', '--help'], ['--cwd='], ['--cwd=--help']])(
    'should reject missing working directories: %j',
    (...args) => {
      expect(() => parseInvocation(args)).toThrow('--cwd requires a directory');
    }
  );
});
