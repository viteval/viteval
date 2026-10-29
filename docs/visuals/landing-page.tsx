import { CTA, Hero, PageRail, TrustStrip } from '@ciderpress/ui/theme';
import type { TrustStripProps } from '@ciderpress/ui/theme';
import { useState, type ReactNode } from 'react';
import { InView } from './in-view';

import pkg from '../../packages/viteval/package.json' with { type: 'json' };

import { FeaturePanels } from './feature-panels';
import { HeroBackground } from './hero-background';
import { Workflow } from './workflow';

import './hero-background.css';
import './motion.css';

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
            Evaluate prompts and agents
            <span className="cp-accent">in TypeScript.</span>
          </>
        }
        tagline="Run evaluations against real datasets, score outputs, and inspect results. Use your own models and infrastructure. Powered by Vitest."
        actions={[
          {
            theme: 'brand',
            text: 'Get started',
            link: '/getting-started',
          },
          { theme: 'alt', text: 'Introduction', link: '/introduction' },
        ]}
        backgroundContent={<HeroBackground />}
        demo={<HeroRun />}
      />
      <TrustStrip lead="Trusted by" names={USERS} />
      <FeaturePanels />
      <Workflow>{children}</Workflow>
      <section
        className="vv-integrations"
        aria-labelledby="vv-integrations-title"
      >
        <p className="vv-eyebrow">Integrations</p>
        <h2 id="vv-integrations-title">Connect the tools you already use.</h2>
        <p>
          Load datasets and save results with local files, cloud storage, or
          supported evaluation platforms.
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
            link: '/getting-started',
          },
        ]}
      />
    </PageRail>
  );
}

function HeroRun() {
  const [replayCount, setReplayCount] = useState(0);

  return (
    <InView fallbackInView>
      {({ ref, inView }) => (
        <div className="vv-hero-demo" ref={ref} data-motion-visible={inView}>
          <figure
            key={replayCount}
            className="vv-hero-terminal"
            aria-label="Order extraction evaluation: three cases passed"
          >
            <figcaption className="vv-hero-terminal__bar">
              <span className="vv-hero-terminal__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>order-extraction.eval.ts</span>
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
                <strong>v5.0.3</strong>
              </div>
              <div className="vv-hero-terminal__file">
                src/order-extraction.eval.ts{' '}
                <span className="vv-hero-terminal__muted">
                  / Order extraction
                </span>
              </div>
              <div className="vv-hero-terminal__cases">
                {[
                  { name: 'Where is order ORD-1042?', duration: '5ms' },
                  { name: 'Please cancel ord-2087.', duration: '1ms' },
                  { name: 'How do I update my address?', duration: '1ms' },
                ].map(({ name, duration }, index) => (
                  <div
                    className="vv-hero-terminal__result"
                    key={name}
                    style={{ animationDelay: `${2300 + index * 450}ms` }}
                  >
                    <span className="vv-hero-terminal__check">✓</span>
                    <span>{name}</span>
                    <span className="vv-hero-terminal__duration">
                      {duration}
                    </span>
                  </div>
                ))}
              </div>
              <div className="vv-hero-terminal__summary">
                <div>
                  <span>Test Files</span>
                  <strong>1 passed</strong>
                  <span className="vv-hero-terminal__muted">(1)</span>
                </div>
                <div>
                  <span>Tests</span>
                  <strong>3 passed</strong>
                  <span className="vv-hero-terminal__muted">(3)</span>
                </div>
                <div>
                  <span>Scorer</span>
                  <span>ExactMatch: 1 on each case</span>
                </div>
                <div>
                  <span>Duration</span>
                  <span>355ms</span>
                </div>
              </div>
            </div>
          </figure>
          <button
            className="vv-hero-demo__replay"
            type="button"
            onClick={() => setReplayCount((count) => count + 1)}
            aria-label="Replay evaluation animation"
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
      )}
    </InView>
  );
}
