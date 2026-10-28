/**
 * Separate maltty's working-directory flag from command tokens.
 * @param tokens - Original command tokens.
 * @returns Routing facts: the cwd override, remaining tokens, bare invocation, evaluation request.
 * @example parseInvocation(['--cwd', './app', 'run']);
 */
export function parseInvocation(tokens: readonly string[]) {
  const cwdIndex = tokens.indexOf('--cwd');
  const inline = tokens.find((token) => token.startsWith('--cwd='));
  const cwd =
    inline?.slice('--cwd='.length) ??
    (cwdIndex === -1 ? undefined : tokens[cwdIndex + 1]);
  if (
    (cwdIndex !== -1 || inline !== undefined) &&
    (!cwd || cwd.startsWith('-'))
  )
    throw new Error('--cwd requires a directory');
  const args = tokens.filter(
    (token, index) =>
      token !== '--cwd' &&
      tokens[index - 1] !== '--cwd' &&
      !token.startsWith('--cwd=')
  );
  const bare = args.length === 0;
  return {
    args,
    cwd,
    // Bare invocations execute evaluations directly: viteval basic usage.
    isBare: bare,
    // `run`, `list`, and bare invocations all execute against installed project dependencies.
    isEvaluation: bare || ['run', 'list'].includes(args[0]!),
  };
}
