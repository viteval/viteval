import { useEffect, useRef } from 'react';

import {
  LocalScene,
  RunnersScene,
  ScoringScene,
  ToolingScene,
} from './feature-scenes';

import './feature-panels.css';

const FEATURES = [
  {
    id: 'familiar-tooling',
    title: 'Built on Vitest',
    description:
      'Your application code, TypeScript, and Vitest configuration. Familiar test-like APIs, not a separate stack.',
    Scene: ToolingScene,
  },
  {
    id: 'built-in-defaults',
    title: 'Useful defaults, built in',
    description:
      'Built-in scorers, reusable datasets, and a local dashboard. Start with the defaults, then add your own criteria.',
    Scene: ScoringScene,
  },
  {
    id: 'local-first',
    title: 'Local-first by default',
    description:
      'Run evaluations and inspect results on your machine. Connect a hosted provider only when you choose.',
    Scene: LocalScene,
  },
  {
    id: 'run-anywhere',
    title: 'Run on your infrastructure',
    description:
      'The same evaluations on your laptop, in CI, or on a runner you control. You choose where the data lives.',
    Scene: RunnersScene,
  },
] as const;

/**
 * Custom landing-page feature panels with compact animated product scenes.
 * @returns A shared-surface grid with gently repeating product scenes.
 * @example
 * <FeaturePanels />
 */
export function FeaturePanels() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.setAttribute(
            'data-visible',
            String(entry.isIntersecting)
          );
        }
      },
      { threshold: 0, rootMargin: '80px 0px' }
    );
    for (const panel of root.querySelectorAll('.vv-feature'))
      observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="vv-features"
      ref={rootRef}
      aria-labelledby="vv-features-title"
    >
      <header className="vv-features__heading">
        <p className="vv-eyebrow">Why Viteval</p>
        <h2 id="vv-features-title">Evals belong beside your tests.</h2>
        <p>
          Keep your application code, TypeScript, and Vitest workflow. Viteval
          adds the evaluation pieces.
        </p>
      </header>
      <div className="vv-features__grid">
        {FEATURES.map(({ id, title, description, Scene }) => (
          <article className="vv-feature" key={id}>
            <div className="vv-feature__copy">
              <h3>
                <a href={`/features#${id}`}>{title}</a>
              </h3>
              <p>{description}</p>
            </div>
            <Scene />
          </article>
        ))}
      </div>
      <footer className="vv-features__footer">
        <a className="vv-features__all" href="/features">
          View all features <span aria-hidden="true">→</span>
        </a>
      </footer>
    </section>
  );
}
