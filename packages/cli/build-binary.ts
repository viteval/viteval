import { createBundler } from '@maltty/bundler';

const SUPPORTED_TARGETS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'linux-x64-musl',
  'windows-arm64',
  'windows-x64',
] as const;

const requestedTargets = process.argv.slice(2);
const targets =
  requestedTargets.length > 0
    ? requestedTargets
    : [
        `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`,
      ];

if (!targets.every(isTarget)) {
  process.stderr.write(`Supported targets: ${SUPPORTED_TARGETS.join(', ')}\n`);
  process.exitCode = 1;
} else {
  const bundler = await createBundler({
    cwd: import.meta.dirname,
    config: {
      entry: './src/native/index.ts',
      commands: './src/native/commands',
      build: {
        out: './dist/native',
        target: 'node26',
        minify: true,
        sourcemap: false,
      },
      compile: {
        name: 'viteval',
        out: './dist/bin',
        targets,
      },
    },
  });

  const [buildError] = await bundler.build({ verbose: true });
  if (buildError) {
    process.stderr.write(`${buildError.message}\n`);
    process.exitCode = 1;
  } else {
    const [compileError, output] = await bundler.compile({ verbose: true });
    if (compileError) {
      process.stderr.write(`${compileError.message}\n`);
      process.exitCode = 1;
    } else {
      for (const binary of output.binaries) {
        process.stdout.write(`${binary.label}: ${binary.path}\n`);
      }
    }
  }
}

function isTarget(
  target: string
): target is (typeof SUPPORTED_TARGETS)[number] {
  return SUPPORTED_TARGETS.some((supported) => supported === target);
}
