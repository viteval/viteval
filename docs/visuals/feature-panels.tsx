import { InView } from './in-view';

import { RunnersScene, ScoringScene, ToolingScene } from './feature-scenes';
import { StorageScene } from './storage-scene';

import './feature-panels.css';
import './motion.css';

const FEATURES = [
  {
    id: 'familiar-tooling',
    title: 'Powered by Vitest',
    description:
      'Evaluate your existing AI code with Vitest handling execution, watch mode, and retries.',
    Scene: BrandedToolingScene,
  },
  {
    id: 'built-in-defaults',
    title: 'Measure what matters',
    description:
      'Check exact answers and structured output, or use embeddings and LLM judges. Set a per-case threshold to fail regressions.',
    Scene: ScoringScene,
  },
  {
    id: 'local-first',
    title: 'Store data where it fits',
    description:
      'Start with local datasets and results, or connect supported storage and evaluation platforms.',
    Scene: StorageScene,
  },
  {
    id: 'run-anywhere',
    title: 'Keep control of execution',
    description:
      'Run the same evaluations on your laptop, in CI, or in your cloud. You choose the infrastructure.',
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
  return (
    <section className="vv-features" aria-labelledby="vv-features-title">
      <header className="vv-features__heading">
        <p className="vv-eyebrow">Why Viteval</p>
        <h2 id="vv-features-title">Your AI stack. Measurable results.</h2>
        <p>
          Keep your models and agent frameworks. Choose your scoring criteria,
          storage, and where evaluations run.
        </p>
      </header>
      <div className="vv-features__grid">
        {FEATURES.map(({ id, title, description, Scene }) => (
          <InView key={id} fallbackInView>
            {({ ref, inView }) => (
              <article
                className="vv-feature"
                ref={ref}
                data-motion-visible={inView}
              >
                <div className="vv-feature__copy">
                  <h3>
                    <a href={`/features#${id}`}>{title}</a>
                  </h3>
                  <p>{description}</p>
                </div>
                <div className="vv-feature__visual">
                  <Scene />
                </div>
              </article>
            )}
          </InView>
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

function BrandedToolingScene() {
  return <ToolingScene brandMark />;
}
