import { Children, useState, type ReactNode } from 'react';

import './workflow.css';

const STEPS = [
  {
    id: 'write',
    label: 'Write',
    title: 'Start with your application code.',
    description:
      'Define support messages and expected order IDs. Check a deterministic extractor first, then run the same cases against a model.',
    link: '/guide/getting-started',
    action: 'Create an evaluation',
    filename: 'order-extraction.eval.ts',
  },
  {
    id: 'run',
    label: 'Run',
    title: 'Check every case.',
    description:
      'Removing case-insensitive matching breaks the lowercase order ID. The case scores 0 and the command exits with a failure.',
    link: '/guide/advanced/ci',
    action: 'Run evaluations in CI',
    filename: 'pnpm exec viteval run',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    title: 'Find out what went wrong.',
    description:
      'Open saved JSON runs in the local dashboard. Trace a failed score back to its input, expected answer, and actual output.',
    link: '/guide/cli#view-results',
    action: 'Explore the local dashboard',
    filename: 'Order extraction / Please cancel ord-2087.',
  },
] as const;

const CODE_FILES = [
  'order-extraction.eval.ts',
  'order-extraction.dataset.ts',
  'vitest.config.ts',
] as const;

/**
 * Connects writing, running, and inspecting the same evaluation in one demo.
 * @returns A manually controlled workflow with code, terminal, and case visuals.
 * @example
 * <Workflow />
 */
export function Workflow({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] =
    useState<(typeof STEPS)[number]['id']>('write');

  return (
    <section className="vv-workflow" aria-labelledby="vv-workflow-title">
      <header className="vv-workflow__heading">
        <p className="vv-eyebrow">Evaluation workflow</p>
        <h2 id="vv-workflow-title">Evaluate order-ID extraction</h2>
        <p>Check normalization and missing values without an API key.</p>
      </header>
      <div className="vv-workflow__layout">
        <ol className="vv-workflow__steps" aria-label="Evaluation workflow">
          {STEPS.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                id={`vv-workflow-step-${step.id}`}
                aria-pressed={activeId === step.id}
                aria-controls={`vv-workflow-panel-${step.id}`}
                onClick={() => setActiveId(step.id)}
              >
                <span className="vv-workflow__number">0{index + 1}</span>
                <span className="vv-workflow__step-copy">
                  <span className="vv-workflow__label">{step.label}</span>
                  <span className="vv-workflow__step-title">{step.title}</span>
                  <span className="vv-workflow__description">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="vv-workflow__visual">
          {STEPS.map((step) => (
            <div
              className={`vv-workflow__panel vv-workflow__panel--${step.id}`}
              id={`vv-workflow-panel-${step.id}`}
              role="region"
              aria-labelledby={`vv-workflow-step-${step.id}`}
              hidden={activeId !== step.id}
              key={step.id}
            >
              <div className="vv-workflow__window-bar">
                <span className="vv-workflow__window-mark" aria-hidden="true">
                  {step.id === 'write' ? 'TS' : '❯'}
                </span>
                <span>{step.filename}</span>
              </div>
              <div className="vv-workflow__canvas">
                {step.id === 'write' && <WriteVisual>{children}</WriteVisual>}
                {step.id === 'run' && <RunVisual />}
                {step.id === 'inspect' && <InspectVisual />}
              </div>
              <footer className="vv-workflow__panel-footer">
                <span>
                  {step.id === 'inspect'
                    ? 'Input, output, and score'
                    : 'order-extraction.eval.ts'}
                </span>
                <a href={step.link}>
                  {step.action} <span aria-hidden="true">→</span>
                </a>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WriteVisual({ children }: { children: ReactNode }) {
  const [filename, setFilename] = useState<string>(CODE_FILES[0]);
  const examples = Children.toArray(children);

  return (
    <>
      <div className="vv-workflow__files" aria-label="Example files">
        {CODE_FILES.map((file) => (
          <button
            type="button"
            key={file}
            aria-pressed={filename === file}
            aria-controls={`vv-workflow-code-${file}`}
            onClick={() => setFilename(file)}
          >
            {file}
          </button>
        ))}
      </div>
      {CODE_FILES.map((file, index) => (
        <div
          className="vv-workflow__code"
          aria-label={file}
          id={`vv-workflow-code-${file}`}
          key={file}
          hidden={filename !== file}
        >
          {examples[index]}
        </div>
      ))}
    </>
  );
}

function RunVisual() {
  return (
    <div className="vv-workflow__run">
      <p className="vv-workflow__command">
        <span>❯</span> pnpm exec viteval run
      </p>
      <p className="vv-workflow__run-heading">
        <b>RUN</b> <span>v5.0.3</span>
      </p>
      <p>
        src/order-extraction.eval.ts{' '}
        <span className="vv-workflow__muted">(3 cases)</span>
      </p>
      <div className="vv-workflow__run-cases">
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>Where is order ORD-1042?</span>
          <span>1.00</span>
        </div>
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>How do I update my address?</span>
          <span>1.00</span>
        </div>
        <div className="vv-workflow__failed">
          <span>×</span>
          <span>Please cancel ord-2087.</span>
          <span>0.00</span>
        </div>
      </div>
      <div className="vv-workflow__failure">
        <span className="vv-workflow__muted">
          mean score 0 is below threshold 1
        </span>
        <div>
          <span>Expected</span>
          <strong className="vv-workflow__green">ORD-2087</strong>
        </div>
        <div>
          <span>Received</span>
          <strong className="vv-workflow__red">Empty string</strong>
        </div>
      </div>
      <p className="vv-workflow__run-summary">
        <span className="vv-workflow__green">2 passed</span>
        <span className="vv-workflow__red">1 failed</span>
        <span className="vv-workflow__muted">3 cases</span>
      </p>
    </div>
  );
}

function InspectVisual() {
  return (
    <div className="vv-workflow__inspect">
      <div className="vv-workflow__inspect-heading">
        <span>Order extraction</span>
        <span className="vv-workflow__status">1 failed case</span>
      </div>
      <div className="vv-workflow__case-strip">
        <span>✓ uppercase ID</span>
        <span>✓ no ID</span>
        <strong>× lowercase ID</strong>
      </div>
      <div className="vv-workflow__case-detail">
        <p className="vv-workflow__field-label">Input</p>
        <p className="vv-workflow__input">Please cancel ord-2087.</p>
        <div className="vv-workflow__comparison">
          <div>
            <span className="vv-workflow__field-label">Expected</span>
            <strong className="vv-workflow__green">ORD-2087</strong>
          </div>
          <div>
            <span className="vv-workflow__field-label">Output</span>
            <strong className="vv-workflow__red">Empty string</strong>
          </div>
        </div>
        <div className="vv-workflow__score-detail">
          <span>ExactMatch</span>
          <span className="vv-workflow__score-track">
            <i />
          </span>
          <strong className="vv-workflow__red">0.00</strong>
        </div>
        <p className="vv-workflow__inspect-note">
          The case-sensitive pattern misses ord-2087 and returns an empty
          string. Restore the regular expression’s i flag to match both cases.
          This case-detail diagram summarizes the captured failure.
        </p>
      </div>
    </div>
  );
}
