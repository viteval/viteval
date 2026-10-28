import { Fragment, useState, type ReactNode } from 'react';
import { InView } from './in-view';

import './workflow.css';
import './motion.css';

const STEPS = [
  {
    id: 'write',
    label: 'Write',
    description:
      'Call your existing AI code with real inputs. Add expected answers and choose how to score each output.',
    link: '/getting-started',
    action: 'Create an evaluation',
    filename: 'support-routing.eval.ts',
  },
  {
    id: 'run',
    label: 'Run',
    description:
      'Run your cases with one command, locally or in CI. Scores below your threshold fail the run.',
    link: '/guide/ci',
    action: 'Run evaluations in CI',
    filename: 'Terminal',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    description:
      'Open saved runs in the dashboard. Expand a failed case to compare its input, expected answer, output, and scores.',
    link: '/guide/results',
    action: 'Explore the local dashboard',
    filename: 'localhost · Viteval',
  },
] as const;

const CASE_RESULTS = [
  {
    input: 'I was charged twice.',
    expected: 'billing',
    output: 'billing',
    score: 1,
  },
  {
    input: 'Reset my password.',
    expected: 'account',
    output: 'account',
    score: 1,
  },
  {
    input: 'Cancel my subscription.',
    expected: 'billing',
    output: 'account',
    score: 0,
  },
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
        <h2 id="vv-workflow-title">AI evals, end to end.</h2>
        <p>Write an eval, run your cases, and inspect failures.</p>
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
                  <span className="vv-workflow__description">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <InView fallbackInView>
          {({ ref, inView }) => (
            <div
              className="vv-workflow__visual"
              ref={ref}
              data-motion-visible={inView}
            >
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
                    <span
                      className="vv-workflow__window-dots"
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>{step.filename}</span>
                  </div>
                  <div className="vv-workflow__canvas">
                    {step.id === 'write' && (
                      <WriteVisual>{children}</WriteVisual>
                    )}
                    {step.id === 'run' && <RunVisual />}
                    {step.id === 'inspect' && <InspectVisual />}
                  </div>
                  <footer className="vv-workflow__panel-footer">
                    <a href={step.link}>
                      {step.action} <span aria-hidden="true">→</span>
                    </a>
                  </footer>
                </div>
              ))}
            </div>
          )}
        </InView>
      </div>
    </section>
  );
}

function WriteVisual({ children }: { children: ReactNode }) {
  return (
    <div className="vv-workflow__editor">
      <div className="vv-workflow__editor-content">
        <div className="vv-workflow__line-numbers" aria-hidden="true">
          {Array.from({ length: 13 }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <div
          className="vv-workflow__code"
          aria-label="Support routing evaluation"
        >
          {children}
        </div>
      </div>
    </div>
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
        src/support-routing.eval.ts{' '}
        <span className="vv-workflow__muted">(3 cases)</span>
      </p>
      <div className="vv-workflow__run-cases">
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>I was charged twice.</span>
          <span>1.00</span>
        </div>
        <div>
          <span className="vv-workflow__green">✓</span>
          <span>Reset my password.</span>
          <span>1.00</span>
        </div>
        <div className="vv-workflow__failed">
          <span>×</span>
          <span>Cancel my subscription.</span>
          <span>0.00</span>
        </div>
      </div>
      <div className="vv-workflow__failure">
        <span className="vv-workflow__muted">
          mean score 0 is below threshold 1
        </span>
        <div>
          <span>Expected</span>
          <strong className="vv-workflow__green">billing</strong>
        </div>
        <div>
          <span>Received</span>
          <strong className="vv-workflow__red">account</strong>
        </div>
      </div>
      <p className="vv-workflow__run-summary">
        <span className="vv-workflow__green">2 passed</span>
        <span className="vv-workflow__red">1 failed</span>
        <span className="vv-workflow__muted">3 cases</span>
      </p>
      <p className="vv-workflow__exit">Process exited with code 1</p>
    </div>
  );
}

function InspectVisual() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(2);

  return (
    <div className="vv-workflow__dashboard">
      <div className="vv-workflow__inspect">
        <div className="vv-workflow__inspect-heading">
          <strong>Support routing</strong>
          <span className="vv-workflow__badge vv-workflow__badge--failed">
            Failed
          </span>
        </div>
        <p className="vv-workflow__run-meta">
          support-routing.eval.ts <span>3 evals</span>
        </p>
        <div className="vv-workflow__stats">
          <div>
            <span>Passed</span>
            <strong className="vv-workflow__pass">2</strong>
          </div>
          <div>
            <span>Failed</span>
            <strong className="vv-workflow__fail">1</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>3</strong>
          </div>
          <div>
            <span>Mean Score</span>
            <strong>0.67</strong>
          </div>
          <div>
            <span>Pass Rate</span>
            <strong>66.7%</strong>
          </div>
        </div>
        <p className="vv-workflow__results-label">Results</p>
        <div className="vv-workflow__results-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Output</th>
                <th>Mean</th>
                <th>Threshold</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {CASE_RESULTS.map((result, index) => (
                <Fragment key={result.input}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        aria-expanded={expandedIndex === index}
                        aria-controls={`vv-case-${index}`}
                        onClick={() =>
                          setExpandedIndex(
                            expandedIndex === index ? null : index
                          )
                        }
                      >
                        <span aria-hidden="true">
                          {expandedIndex === index ? '⌄' : '›'}
                        </span>
                        {result.input}
                      </button>
                    </td>
                    <td>{result.output}</td>
                    <td>
                      <span
                        className={`vv-workflow__badge vv-workflow__badge--${result.score === 1 ? 'passed' : 'failed'}`}
                      >
                        {result.score.toFixed(2)}
                      </span>
                    </td>
                    <td>1</td>
                    <td>
                      <span
                        className={`vv-workflow__badge vv-workflow__badge--${result.score === 1 ? 'passed' : 'failed'}`}
                      >
                        {result.score === 1 ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                  <tr id={`vv-case-${index}`} hidden={expandedIndex !== index}>
                    <td colSpan={5} className="vv-workflow__expanded-cell">
                      <dl className="vv-workflow__expanded-values">
                        <div>
                          <dt>Input:</dt>
                          <dd>{result.input}</dd>
                        </div>
                        <div>
                          <dt>Expected:</dt>
                          <dd>{result.expected}</dd>
                        </div>
                        <div>
                          <dt>Output:</dt>
                          <dd>{result.output}</dd>
                        </div>
                        <div>
                          <dt>Scores:</dt>
                          <dd>
                            <span className="vv-workflow__badge">
                              ExactMatch: {result.score}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
