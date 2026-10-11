/**
 * Separate maltty's working-directory flag from native evaluation arguments.
 * @param tokens - Original command tokens.
 * @returns Routing information and unmodified native tokens apart from --cwd.
 * @example parseInvocation(['--cwd', './app', 'data']);
 */
export function parseInvocation(tokens: readonly string[]) {
  const cwdIndex = tokens.indexOf('--cwd');
  const inline = tokens.find((token) => token.startsWith('--cwd='));
  const cwd =
    inline?.slice('--cwd='.length) ??
    (cwdIndex === -1 ? undefined : tokens[cwdIndex + 1]);
  if (cwdIndex !== -1 && (!cwd || cwd.startsWith('-')))
    throw new Error('--cwd requires a directory');
  const args = tokens.filter(
    (token, index) =>
      token !== '--cwd' &&
      tokens[index - 1] !== '--cwd' &&
      !token.startsWith('--cwd=')
  );
  return {
    args,
    cwd,
    isProjectCommand: ['init', 'data', 'ui'].includes(args[0]),
    isRootHelp:
      args.length === 1 &&
      ['--help', '-h', '--version', '-v'].includes(args[0]),
  };
}
