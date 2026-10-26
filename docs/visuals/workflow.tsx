import { Children, useState, type ReactNode } from 'react';

import './workflow.css';

const STEPS = [
  {
    id: 'write',
    label: 'Write',
    title: 'Start with your application code.',
    description:
      'Import your agent and a reusable dataset. Load cases from S3 through the dataset provider, then score the answers.',
    link: '/guide/providers#s3-and-google-cloud-storage-datasets',
    action: 'Configure S3 datasets',
    filename: 'knowledge.eval.ts',
  },
  {
    id: 'run',
    label: 'Run',
    title: 'Catch the regression.',
    description:
      'Let Vitest run the cases. See which answers pass your criteria—and which one needs a closer look.',
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
    filename: 'Knowledge answers / retention-policy',
  },
] as const;

const CODE_FILES = [
  'knowledge.eval.ts',
  'knowledge.dataset.ts',
  'viteval.setup.ts',
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
        <p className="vv-eyebrow">From your first case to your next fix</p>
        <h2 id="vv-workflow-title">Write. Run. Inspect.</h2>
        <p>One evaluation. The whole feedback loop.</p>
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
                <span className="vv-workflow__example">
                  {step.id === 'write' ? 'example' : 'illustrative view'}
                </span>
              </div>
              <div className="vv-workflow__canvas">
                {step.id === 'write' && <WriteVisual>{children}</WriteVisual>}
                {step.id === 'run' && <RunVisual />}
                {step.id === 'inspect' && <InspectVisual />}
              </div>
              <footer className="vv-workflow__panel-footer">
                <span>
                  {step.id === 'inspect'
                    ? 'Same case. Full context.'
                    : 'knowledge.eval.ts'}
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
        <b>RUN</b> Viteval <span> / powered by Vitest</span>
      </p>
      <p>
        knowledge.eval.ts <span className="vv-workflow__muted">(3 cases)</span>
      </p>
      <div className="vv-workflow__run-cases">
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>workspace-invites</span>
          <span>1.00</span>
        </div>
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>api-rate-limits</span>
          <span>0.87</span>
        </div>
        <div className="vv-workflow__failed">
          <span>×</span>
          <span>retention-policy</span>
          <span>0.33</span>
        </div>
      </div>
      <div className="vv-workflow__failure">
        <span className="vv-workflow__muted">
          retention-policy / Factuality
        </span>
        <div>
          <span>Expected</span>
          <strong className="vv-workflow__green">30-day retention</strong>
        </div>
        <div>
          <span>Received</span>
          <strong className="vv-workflow__red">90-day retention</strong>
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
        <span>Knowledge answers</span>
        <span className="vv-workflow__status">1 failed case</span>
      </div>
      <div className="vv-workflow__case-strip">
        <span>✓ workspace-invites</span>
        <span>✓ api-rate-limits</span>
        <strong>× retention-policy</strong>
      </div>
      <div className="vv-workflow__case-detail">
        <p className="vv-workflow__field-label">Input</p>
        <p className="vv-workflow__input">How long are audit logs retained?</p>
        <div className="vv-workflow__comparison">
          <div>
            <span className="vv-workflow__field-label">Expected</span>
            <strong className="vv-workflow__green">
              30 days after creation.
            </strong>
          </div>
          <div>
            <span className="vv-workflow__field-label">Output</span>
            <strong className="vv-workflow__red">
              Logs are kept for 90 days.
            </strong>
          </div>
        </div>
        <div className="vv-workflow__score-detail">
          <span>Factuality / LLM judge</span>
          <span className="vv-workflow__score-track">
            <i />
          </span>
          <strong className="vv-workflow__red">0.00</strong>
        </div>
        <p className="vv-workflow__inspect-note">
          The answer contradicts the reference policy. Inspect the retrieved
          documents before changing the prompt. Factuality 0, AnswerCorrectness
          0, AnswerRelevancy 1: mean 0.33, below the 0.85 threshold.
          Illustrative judge scores, not a live run.
        </p>
      </div>
    </div>
  );
}
