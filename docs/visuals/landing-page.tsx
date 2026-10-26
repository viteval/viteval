import { CTA, Hero, PageRail, TrustStrip } from '@ciderpress/ui/theme';
import type { TrustStripProps } from '@ciderpress/ui/theme';
import { useState, type ReactNode } from 'react';

import pkg from '../../packages/viteval/package.json' with { type: 'json' };

import { FeaturePanels } from './feature-panels';
import { HeroBackground } from './hero-background';
import { Workflow } from './workflow';

import './hero-background.css';

const USERS: TrustStripProps['names'] = [
  {
    src: { dark: '/assets/bytefarm.svg', light: '/assets/bytefarm-light.svg' },
    alt: 'Bytefarm',
    href: 'https://bytefarm.sh/',
  },
  {
    src: '/assets/voltagent.svg',
    alt: 'VoltAgent',
    href: 'https://voltagent.dev/',
  },
  {
    src: '/assets/holly.svg',
    alt: 'Holly',
    href: 'https://www.hollygov.com/',
    mono: true,
  },
  {
    src: { dark: '/assets/joggr-dark.svg', light: '/assets/joggr-light.svg' },
    alt: 'Joggr',
  },
];

const PROVIDERS: TrustStripProps['names'] = [
  {
    src: '/assets/provider-braintrust.svg',
    alt: 'Braintrust',
    href: '/guide/providers#braintrust',
    mono: true,
  },
  {
    src: '/assets/provider-langfuse.svg',
    alt: 'Langfuse',
    href: '/guide/providers#langfuse',
  },
  {
    src: '/assets/provider-voltops.svg',
    alt: 'VoltOps',
    href: '/guide/providers#voltops-hosted-evaluations',
  },
  {
    src: '/assets/provider-sqlite.svg',
    alt: 'SQLite',
    href: '/guide/providers#sqlite',
    mono: true,
  },
  {
    src: '/assets/provider-s3.svg',
    alt: 'Amazon S3',
    href: '/guide/providers#s3-and-google-cloud-storage-datasets',
  },
  {
    src: '/assets/provider-gcs.svg',
    alt: 'Google Cloud Storage',
    href: '/guide/providers#s3-and-google-cloud-storage-datasets',
  },
];

/**
 * Composes the custom homepage without the config-driven block renderer.
 * @returns The hero, adoption strip, animated features, workflow, and closing CTA.
 * @example
 * <LandingPage />
 */
export function LandingPage({ children }: { children: ReactNode }) {
  return (
    <PageRail>
      <Hero
        eyebrow={`v${pkg.version}`}
        title={
          <>
            TypeScript-native evals,
            <span className="cp-accent">powered by Vitest.</span>
          </>
        }
        tagline="LLM evaluations powered by Vitest. Familiar TypeScript APIs, built-in scorers, and local results. Run the same evaluations in CI or your own infrastructure."
        actions={[
          {
            theme: 'brand',
            text: 'Get started',
            link: '/guide/getting-started',
          },
          { theme: 'alt', text: 'Why Viteval', link: '/features' },
        ]}
        backgroundContent={<HeroBackground />}
        demo={<HeroRun />}
      />
      <TrustStrip lead="Used by" names={USERS} />
      <FeaturePanels />
      <Workflow>{children}</Workflow>
      <section
        className="vv-integrations"
        aria-labelledby="vv-integrations-title"
      >
        <p className="vv-eyebrow">Integrations</p>
        <h2 id="vv-integrations-title">
          Local first. Connected when you need it.
        </h2>
        <p>
          Keep results in local JSON, or connect your preferred storage and
          evaluation tools.
        </p>
        <TrustStrip lead="" names={PROVIDERS} />
        <a className="vv-integrations__cta" href="/guide/providers">
          View integrations <span aria-hidden="true">→</span>
        </a>
      </section>
      <CTA
        title="Run your first evaluation."
        subtitle="Open source. No hosted account required."
        actions={[
          {
            theme: 'brand',
            text: 'Write your first evaluation',
            link: '/guide/getting-started',
          },
        ]}
      />
    </PageRail>
  );
}

function HeroRun() {
  const [replayCount, setReplayCount] = useState(0);

  return (
    <div className="vv-hero-demo">
      <figure
        key={replayCount}
        className="vv-hero-terminal"
        aria-label="Example evaluation run: three cases passed"
      >
        <figcaption className="vv-hero-terminal__bar">
          <span className="vv-hero-terminal__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>~/my-agent</span>
          <span className="vv-hero-terminal__example">
            after the fix / example
          </span>
        </figcaption>
        <div className="vv-hero-terminal__body">
          <div className="vv-hero-terminal__command">
            <span className="vv-hero-terminal__prompt">❯</span>
            <span className="vv-hero-terminal__typed">
              pnpm exec viteval run
            </span>
          </div>
          <div className="vv-hero-terminal__runner">
            <span className="vv-hero-terminal__badge">RUN</span>{' '}
            <strong>Viteval</strong>{' '}
            <span className="vv-hero-terminal__muted">/ powered by Vitest</span>
          </div>
          <div className="vv-hero-terminal__file">
            knowledge.eval.ts{' '}
            <span className="vv-hero-terminal__muted">(3 cases)</span>
          </div>
          <div className="vv-hero-terminal__cases">
            {[
              { name: 'workspace-invites', duration: '2.4s' },
              { name: 'api-rate-limits', duration: '1.8s' },
              { name: 'retention-policy', duration: '2.1s' },
            ].map(({ name, duration }, index) => (
              <div
                className="vv-hero-terminal__result"
                key={name}
                style={{ animationDelay: `${2300 + index * 450}ms` }}
              >
                <span className="vv-hero-terminal__check">✓</span>
                <span>Knowledge answers / {name}</span>
                <span className="vv-hero-terminal__duration">{duration}</span>
              </div>
            ))}
          </div>
          <div className="vv-hero-terminal__summary">
            <div>
              <span>Eval files</span>
              <strong>1 passed</strong>
              <span className="vv-hero-terminal__muted">(1)</span>
            </div>
            <div>
              <span>Cases</span>
              <strong>3 passed</strong>
              <span className="vv-hero-terminal__muted">(3)</span>
            </div>
            <div>
              <span>Scorer</span>
              <span>factual · answerCorrectness · answerRelevancy</span>
            </div>
            <div>
              <span>Duration</span>
              <span>6.3s</span>
            </div>
          </div>
        </div>
      </figure>
      <button
        className="vv-hero-demo__replay"
        type="button"
        onClick={() => setReplayCount((count) => count + 1)}
        aria-label="Replay example evaluation animation"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 3v6h-6" />
          <path d="M21 12a9 9 0 1 1-2.64-6.36L21 9" />
        </svg>
        Replay animation
      </button>
    </div>
  );
}
